'use strict';

angular.module('stats', ['sql', 'health', 'tableinfo', 'nodeinfo'])
  .factory('ClusterState', function($http, $interval, $timeout, $log, $q, $rootScope,
  baseURI, SQLQuery, queryResultToObjects, TableList, Health, ShardInfo, NodeInfo) {
    var healthInterval,
      statusInterval,
      reachabilityInterval,
      shardsInterval,
      checkInterval;

    // definition of function variables
    var refreshShardInfo,
      refreshState,
      refreshHealth,
      checkReachability,
      setReachability;

    var data = {
      online: true,
      tables: [],
      shards: [],
      partitions: [],
      cluster: [],
      name: '--',
      status: '--',
      load: ['-.-', '-.-', '-.-'],
      loadHistory: [[],[],[]],
      version: null
    };

    var diskIoHistory = {};
    var refreshInterval = 5000;
    var historyLength = 60;

    setReachability = function(online) {
      if (data.online && !online) {
        data.online = false;
        $log.warn('Cluster is offline.');
        $interval.cancel(healthInterval);
        $interval.cancel(statusInterval);
        $interval.cancel(shardsInterval);
        $interval.cancel(checkInterval);
        data.status = '--';
        data.tables = [];
        data.cluster = [];
        data.name = '--';
        data.load = ['-.-', '-.-', '-.-'];
        data.loadHistory = [[],[],[]];
        data.version = null;
      } else if (!data.online && online) {
        data.online = true;
        $log.info('Cluster is online.');
        healthInterval = $interval(refreshHealth, refreshInterval);
        refreshHealth();
        statusInterval = $interval(refreshState, refreshInterval);
        refreshState();
        shardsInterval = $interval(refreshShardInfo, refreshInterval);
        refreshShardInfo();
      }
    };

    checkReachability = function() {
      $http.get(baseURI.getURI('/'), {
          headers: {'Accept': 'application/json'}
        }).success(function(response) {
          if (typeof response === 'object') {
            var version = response.version;
            data.version = {
              number: version.number,
              hash: version.build_hash,
              snapshot: version.build_snapshot
            };
            setReachability(true);
          } else {
            data.version = null;
            setReachability(false);
          }
        }).error(function() {
          setReachability(false);
        });
    };

    var addToLoadHistory = function(load) {
      var lh = data.loadHistory;
      if (load.length == lh.length) {
        for (var i = 0; i < load.length; i++) {
          lh[i].push(load[i]);
          lh[i] = lh[i].splice(-historyLength, historyLength);
        }
      }
    };

    var onErrorResponse = function(query) {
      if (query && query.error) {
        var status = query.error.status;
        setReachability(!(status === 0 || status === 404));
      }
    };

    var prepareLoadInfo = function(nodeInfo) {
      var numNodes = nodeInfo.length;
      var load = [0.0, 0.0, 0.0];
      for (var i = 0; i < numNodes; i++) {
        var nodeLoad = nodeInfo[i].load;
        if (nodeLoad) {
          load[0] += nodeLoad['1'] / numNodes;
          load[1] += nodeLoad['5'] / numNodes;
          load[2] += nodeLoad['15'] / numNodes;
        }
      }
      addToLoadHistory(load);
      return load;
    };

    var prepareIoStats = function(nodeInfo) {
      var numNodes = nodeInfo.length;
      for (var i = 0; i < numNodes; i++) {
        var node = nodeInfo[i];
        var currentValue = {
          timestamp: node.timestamp,
          data: node.fs.total
        };
        if (diskIoHistory[node.id]) {
          var lastValue = diskIoHistory[node.id];
          var timeDelta = (currentValue.timestamp - lastValue.timestamp) / 1000.0;
          var readsDelta = currentValue.data.reads - lastValue.data.reads;
          var writesDelta = currentValue.data.writes - lastValue.data.writes;
          var readBytesDelta = currentValue.data.bytes_read - lastValue.data.bytes_read;
          var writtenBytesDelta = currentValue.data.bytes_written - lastValue.data.bytes_written;
          node.iostats = {
            'rps': currentValue.data.reads > 0 ? (readsDelta / timeDelta) : -1,
            'wps':  currentValue.data.writes > 0 ? (writesDelta / timeDelta) : -1,
            'rbps': currentValue.data.bytes_read > 0 ? (readBytesDelta / timeDelta) : -1,
            'wbps': currentValue.data.bytes_written > 0 ? (writtenBytesDelta / timeDelta) : -1
          };
        } else {
          node.iostats = {
            'rps': -1,   // reads per second
            'wps': -1,   // writes per second
            'rbps': -1,  // bytes read per second
            'wbps': -1   // bytes written per second
          };
        }
        diskIoHistory[node.id] = currentValue;
      }
      return nodeInfo;
    };

    refreshHealth = function() {
      // We want to get the tables as soon as they become available so we use the promise object.
      TableList.execute()
        .then(null, null, function(res){
          if (res.success || !data.online) {
            var h = res.data.tables.reduce(function(memo, obj){
              var health = Health.fromString(obj.health);
              return Math.max(health.level, memo);
            }, 0);
            data.status = new Health(h).name;
            data.tables = res.data.tables;
          } else {
            data.status = '--';
            data.tables = [];
          }
          $rootScope.$broadcast('clusterState.refreshed');
        });
    };

    refreshState = function() {
      NodeInfo.executeNodeQuery()
        .then(function(response){
          if (!data.online) {
            return;
          }
          data.load = prepareLoadInfo(response);
          data.cluster = prepareIoStats(response);
          NodeInfo.executeClusterQuery()
            .then(function(response){
              if (!data.online) {
                return;
              }
              data.name = response[0].name;
              data.master_node = response[0].master_node;
              // resolve global NodeInfo deferred object
              var result = {
                name: data.name,
                master_node: data.master_node,
                nodes: data.cluster.length
              };
              NodeInfo.deferred.resolve(result);
              $rootScope.$broadcast('clusterState.refreshed');
            }, onErrorResponse);
        }, onErrorResponse);
    };

    refreshShardInfo = function() {
      if (!data.online) {
        return;
      }

      // table statement
      ShardInfo.executeTableStmt()
        .then(function(tables) {

          // shard statement
          ShardInfo.executeShardStmt()
            .then(function(shards) {

              // partition statement
              ShardInfo.executePartStmt()
                .then(function(partitions) {

                  // recovery statement
                  ShardInfo.executeRecoveryStmt()
                    .then(function(recovery) {
                      data.shards = shards;
                      data.tables = tables;
                      data.partitions = partitions;
                      data.recovery = recovery;
                      // resolve global ShardInfo deferred object
                      var result = {
                        tables: data.tables,
                        shards: data.shards,
                        partitions: data.partitions,
                        recovery: data.recovery
                      };
                      ShardInfo.deferred.resolve(result);
                      $rootScope.$broadcast('clusterState.refreshed');
                    }).catch(function() {
                      var result = {
                        tables: data.tables,
                        shards: data.shards,
                        partitions: data.partitions
                      };
                      ShardInfo.deferred.reject(result);
                      $rootScope.$broadcast('clusterState.refreshed');
                    });
                }).catch(function() {
                  var result = {
                    tables: data.tables,
                    shards: data.shards
                  };
                  ShardInfo.deferred.reject(result);
                  $rootScope.$broadcast('clusterState.refreshed');
                });
            }).catch(function() {
              var result = {
                tables: data.tables
              };
              ShardInfo.deferred.reject(result);
              $rootScope.$broadcast('clusterState.refreshed');
            });
        }).catch(function () {
          ShardInfo.deferred.reject({});
          $rootScope.$broadcast('clusterState.refreshed');
        });
    };

    checkReachability();
    reachabilityInterval = $interval(checkReachability, refreshInterval);

    refreshHealth();
    healthInterval = $interval(refreshHealth, refreshInterval);

    refreshShardInfo();
    shardsInterval = $interval(refreshShardInfo, refreshInterval);

    refreshState();
    $timeout(refreshState, 500); // we want IOPs quickly!
    statusInterval = $interval(refreshState, refreshInterval);

    return {
      data: data,
      HISTORY_LENGTH: historyLength
    };
  });
