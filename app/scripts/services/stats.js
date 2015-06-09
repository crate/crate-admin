'use strict';

angular.module('stats', ['sql', 'health', 'tableinfo'])
  .factory('ClusterState', function ($http, $interval, $timeout, $location, $log, SQLQuery, queryResultToObjects, TableList, TableInfo, Health, ShardInfo, $q) {
    var healthInterval, statusInterval, reachabilityInterval, shardsInterval;

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
    var historyLength = 180;

    var checkReachability = function checkReachability(){
      var baseURI = $location.protocol() + "://" + $location.host() + ":" + $location.port();
      var storedURI = localStorage.getItem("crate.base_uri");
      if (storedURI) baseURI = storedURI;
      $http.get(baseURI+"/").success(function(response) {
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
      });
    };

    var setReachability = function setReachability(online) {
      if (data.online && !online) {
        data.online = false;
        $log.warn("Cluster is offline.");
        $interval.cancel(healthInterval);
        $interval.cancel(statusInterval);
        $interval.cancel(shardsInterval);
        data.status = '--';
        data.tables = [];
        data.cluster = [];
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
      var status = query.error.status;
      if (status === 0 || status === 404) setReachability(false);
    };

    var prepareLoadInfo = function(nodeInfo) {
      var numNodes = nodeInfo.length;
      var load = [0.0, 0.0, 0.0];
      for (var i=0; i<numNodes; i++) {
        var node = nodeInfo[i];
        var j = 0;
        for (var k in node.load) {
          load[j] += node.load[k] / numNodes;
          j++;
        }
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
      if (!data.online) return;
      // We want to get the tables as soon as they become available so we use the promise object.
      TableList.promise.then(null, null, function(res){
        if (res.success) {
          var h = res.data.tables.reduce(function(memo, obj, idx){
            var level = Health.fromString(obj.health).level;
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
      if (!data.online) return;

      var clusterQuery = SQLQuery.execute(
        'select id, name, hostname, rest_url, port, load, heap, fs, os[\'cpu\'] as cpu, load, version, os[\'probe_timestamp\'] as timestamp, '+ 
        'process[\'cpu\'] as proc_cpu ' +
        'from sys.nodes');
      clusterQuery.success(function(sqlQuery) {
        var response = queryResultToObjects(sqlQuery,
            ['id', 'name', 'hostname', 'rest_url', 'port', 'load', 'heap', 'fs', 'cpu', 'load', 'version', 'timestamp', 'proc_cpu']);
        data.load = prepareLoadInfo(response);
        data.cluster = prepareIoStats(response);
      }).error(onErrorResponse);

      var clusterName = SQLQuery.execute('select name from sys.cluster');
      clusterName.success(function(sqlQuery) {
          var row = sqlQuery.rows[0];
          data.name = row[0]
      }).error(onErrorResponse);
    };

    var refreshShardInfo = function () {
      if (!data.online) return;

      ShardInfo.executeTableStmt()
        .then(function (tables) {
          data.tables = tables;
          ShardInfo.executeShardStmt()
            .then(function (shards) {
              data.shards = shards;
              ShardInfo.executePartStmt()
                .then(function (partitions) {
                  data.partitions = partitions;
                  var result = {
                    tables: data.tables,
                    shards: data.shards,
                    partitions: data.partitions
                  };
                  ShardInfo.deferred.resolve(result);
                })
                .catch(function () {
                  var result = {
                    tables: data.tables,
                    shards: data.shards
                  };
                  ShardInfo.deferred.reject(result);
                })
            })
            .catch(function () {
              var result = {
                tables: data.tables
              };
              ShardInfo.deferred.reject(result);
            })
        })
        .catch(function () {
          ShardInfo.deferred.reject({});
        });
    };

    checkReachability();

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
