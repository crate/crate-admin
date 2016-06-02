'use strict';

angular.module('stats', ['sql', 'health', 'tableinfo', 'nodeinfo'])
  .factory('ClusterState', function ($http, $interval, $timeout, $log, baseURI, SQLQuery, queryResultToObjects, TableList, Health, ShardInfo, NodeInfo, ClusterCheck, $q) {
    var healthInterval, statusInterval, reachabilityInterval, shardsInterval, checkInterval;

    var data = {
      online: true,
      tables: [],
      shards: [],
      partitions: [],
      checks: [],
      cluster: [],
      name: '--',
      status: '--',
      load: ['-.-', '-.-', '-.-'],
      loadHistory: [[],[],[]],
      version: null
    };

    var diskIoHistory = {};
    var refreshInterval = 5000;
    var refreshIntervalClusterCheck = 60000;
    var historyLength = 180;

    var checkReachability = function checkReachability(){
      $http.get(baseURI("/")).success(function(response) {
        if (typeof response === 'object') {
          var version = response.version;
          data.version = {
            'number': version.number,
            'hash': version.build_hash,
            'snapshot': version.build_snapshot
          };
          setReachability(true);
        } else {
          data.version = null;
          if (!storedURI) {
            $log.warn('If you develop and run Crate Admin UI locally you need to set the base_uri. See README.rst for further information.');
          }
          setReachability(false);
        }
      }).error(function(data, status) {
        setReachability(false);
      });
    };

    var setReachability = function setReachability(online) {
      if (data.online && !online) {
        data.online = false;
        $log.warn("Cluster is offline.");
        $interval.cancel(healthInterval);
        $interval.cancel(statusInterval);
        $interval.cancel(shardsInterval);
        $interval.cancel(checkInterval);
        data.status = '--';
        data.tables = [];
        data.cluster = [];
        data.checks = [];
        data.name = '--';
        data.load = ['-.-', '-.-', '-.-'],
        data.loadHistory = [[],[],[]];
        data.version = null;
        reachabilityInterval = $interval(checkReachability, refreshInterval);
      } else if (!data.online && online) {
        $interval.cancel(reachabilityInterval);
        data.online = true;
        $log.info("Cluster is online.");
        healthInterval = $interval(refreshHealth, refreshInterval);
        refreshHealth();
        statusInterval = $interval(refreshState, refreshInterval);
        refreshState();
        shardsInterval = $interval(refreshShardInfo, refreshInterval);
        refreshShardInfo();
        checkInterval = $interval(refreshClusterCheck, refreshIntervalClusterCheck);
        refreshClusterCheck();
      }
    };

    var addToLoadHistory = function(load) {
      if (load.length != data.loadHistory.length) return;
      var lh = data.loadHistory;
      for (var i=0; i<load.length; i++) {
          lh[i].push(load[i]);
          lh[i] = lh[i].splice(-historyLength, historyLength);
      }
    };

    var onErrorResponse = function(query) {
        if (query && query.error) var status = query.error.status;
        if (status === 0 || status === 404) setReachability(false);
    };

    var prepareLoadInfo = function(nodeInfo) {
      var numNodes = nodeInfo.length;
      var load = [0.0, 0.0, 0.0];
      for (var i=0; i<numNodes; i++) {
        var nodeLoad = nodeInfo[i].load;
        load[0] += nodeLoad['1'] / numNodes;
        load[1] += nodeLoad['5'] / numNodes;
        load[2] += nodeLoad['15'] / numNodes;
      }
      addToLoadHistory(load);
      return load;
    };

    var prepareIoStats = function(nodeInfo) {
      var numNodes = nodeInfo.length;
      for (var i=0; i<numNodes; i++) {
        var node = nodeInfo[i];
        var currentValue = {
          'timestamp': node.timestamp,
          'data': node.fs.total
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

    var refreshHealth = function() {
      // We want to get the tables as soon as they become available so we use the promise object.
      TableList.execute().then(null, null, function(res){
        if (res.success || !data.online) {
          var h = res.data.tables.reduce(function(memo, obj, idx){
            var level = Health.levelFromString(obj.health);
            return Math.max(level, memo);
          }, 0);
          data.status = new Health(h).name;
          data.tables = res.data.tables;
        } else {
          data.status = '--';
          data.tables = [];
        }
      });
    };

    var refreshState = function() {
      NodeInfo.executeNodeQuery().then(function(response){
        if (!data.online) return;
        data.load = prepareLoadInfo(response);
        data.cluster = prepareIoStats(response);
        NodeInfo.executeClusterQuery().then(function(response){
          if (!data.online) return;
          data.name = response[0].name;
          data.master_node = response[0].master_node;
          // resolve global NodeInfo deferred object
          var result = {
            name: data.name,
            master_node: data.master_node,
            nodes: data.cluster.length
          }
          NodeInfo.deferred.resolve(result);
        }, onErrorResponse);
      }, onErrorResponse);
    };

    var refreshShardInfo = function() {
      if (!data.online) return;

      ShardInfo.executeTableStmt().then(function(tables) {
          ShardInfo.executeShardStmt().then(function(shards) {
              ShardInfo.executePartStmt().then(function(partitions) {
                  ShardInfo.executeRecoveryStmt().then(function(recovery) {
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
                  }).catch(function() {
                    var result = {
                      tables: data.tables,
                      shards: data.shards,
                      partitions: data.partitions
                    };
                    ShardInfo.deferred.reject(result);
                  });
              }).catch(function() {
                  var result = {
                    tables: data.tables,
                    shards: data.shards
                  };
                  ShardInfo.deferred.reject(result);
              });
          }).catch(function() {
              var result = {
                tables: data.tables
              };
              ShardInfo.deferred.reject(result);
          });
      }).catch(function () {
          ShardInfo.deferred.reject({});
      });
    };

    var refreshClusterCheck = function refreshClusterCheck() {
        if (!data.online) return;

        ClusterCheck.executeStmt().then(function(checks) {
          data.checks = checks;
          ClusterCheck.deferred.resolve(data.checks);
        }).catch(function() {
          ClusterCheck.deferred.reject({});
        });
    };

    checkReachability();

    refreshClusterCheck();
    checkInterval = $interval(refreshClusterCheck, refreshIntervalClusterCheck);

    refreshHealth();
    healthInterval = $interval(refreshHealth, refreshInterval);

    refreshShardInfo();
    shardsInterval = $interval(refreshShardInfo, refreshInterval);

    refreshState();
    $timeout(refreshState, 500); // we want IOPs quickly!
    statusInterval = $interval(refreshState, refreshInterval);

    return {
      refreshClusterCheck: refreshClusterCheck,
      data: data,
      HISTORY_LENGTH: historyLength
    };
  });
