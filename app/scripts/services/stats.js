'use strict';

import './sql';
import './health';
import './tableinfo';
import './nodeinfo';
import './clusterEventsHandler';

const stats = angular.module('stats', ['sql', 'health', 'tableinfo', 'nodeinfo', 'events'])
  .factory('ClusterState', function ($http, $interval, $timeout, $log, $q, $rootScope,
    baseURI, SQLQuery, queryResultToObjects, TableList, Health, ShardInfo, NodeInfo, ClusterEventsHandler) {
    var reachabilityInterval,
      ClusterStateInterval;

    // definition of function variables
    var refreshClusterState,
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
        $interval.cancel(ClusterStateInterval);
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
        ClusterStateInterval = $interval(refreshClusterState, refreshInterval);
        refreshClusterState();
      }
    };

    checkReachability = function() {
      $http.get(baseURI.getURI('/'), {
        headers: {
          'Accept': 'application/json'
        }
      }).then(function (response) {
        if (typeof response === 'object') {
          var version = response.data.version;
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

      }, function () {
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
      var empty_iostats = {
        'rps': -1,   // reads per second
        'wps': -1,   // writes per second
        'rbps': -1,  // bytes read per second
        'wbps': -1   // bytes written per second
      };
      for (var i = 0; i < numNodes; i++) {
        var node = nodeInfo[i];
        var currentValue = {
          timestamp: node.timestamp
        };
        // check if filesystem data is available
        if (node.fs) {
          currentValue.data= node.fs.total;
        }
        
        if (diskIoHistory[node.id] && currentValue.data) {
          var lastValue = diskIoHistory[node.id];
          var timeDelta = (currentValue.timestamp - lastValue.timestamp) / 1000.0;
          if (lastValue.data) {
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
              node.iostats = empty_iostats;
            }
        } else {
          node.iostats = empty_iostats;
        }
        diskIoHistory[node.id] = currentValue;
      }
      return nodeInfo;
    };

  refreshClusterState = function () {
    if (!data.online) {
      return;
    }
    $q.all([ShardInfo.executeTableStmt(),
              ShardInfo.executeShardStmt(),
              ShardInfo.executePartStmt(),
              ShardInfo.executeRecoveryStmt(),
              NodeInfo.executeClusterQuery(),
              NodeInfo.executeNodeQuery()])
      .then(function (values) {

        data.tables = values[0];
        data.shards = values[1];
        data.partitions = values[2];
        data.recovery = values[3];

        // resolve global ShardInfo deferred object
        var result = {
          tables: data.tables,
          shards: data.shards,
          partitions: data.partitions,
          recovery: data.recovery
        };

        ShardInfo.deferred.resolve(result);

        var nodeinfo = values[4];

        data.name = nodeinfo[0].name;
        data.master_node = nodeinfo[0].master_node;

        // resolve global NodeInfo deferred object
        var nodeinfoResult = {
          name: data.name,
          master_node: data.master_node,
          nodes: data.cluster.length
        };

        NodeInfo.deferred.resolve(nodeinfoResult);

        var clusterinfo = values[5];
        data.load = prepareLoadInfo(clusterinfo);
        data.cluster = prepareIoStats(clusterinfo);

        var tableinfo = TableList.execute(data.tables, data.shards, data.partitions, data.recovery);

        if (tableinfo.success) {
          var h = tableinfo.data.tables.reduce(function (memo, obj) {
            var health = Health.fromString(obj.health);
            return Math.max(health.level, memo);
          }, 0);
          data.status = new Health(h).name;
          data.tables = tableinfo.data.tables;
        } 
        ClusterEventsHandler.trigger('STATE_REFRESHED');
      }).catch(function (query) {
        onErrorResponse(query);
        ShardInfo.deferred.reject({});
        data.status = '--';
        data.tables = [];
        ClusterEventsHandler.trigger('STATE_REFRESHED');
      });
  };
    checkReachability();
    reachabilityInterval = $interval(checkReachability, refreshInterval);

    refreshClusterState();
    ClusterStateInterval = $interval(refreshClusterState, refreshInterval);

    return {
      data: data,
      HISTORY_LENGTH: historyLength,
      refresh: refreshClusterState
    };
  });

export default stats;
