'use strict';

angular.module('stats', ['sql'])
  .factory('ClusterState', function ($http, $interval, $location, $log, SQLQuery, _object, queryResultToObjects) {
    var healthInterval, statusInterval, reachabilityInterval;

    var data = {
      online: true,
      tableInfo: null,
      cluster: {},
      name: '--',
      status: '--',
      load: ['-.-', '-.-', '-.-'],
      loadHistory: [[],[],[]]
    };

    var refreshInterval = 5000;
    var historyLength = 100;

    var checkReachability = function checkReachability(){
      var baseURI = $location.protocol() + "://" + $location.host() + ":" + $location.port();
      if (localStorage.getItem("crate.base_uri") != null) {
        baseURI = localStorage.getItem("crate.base_uri");
        $log.debug("Loaded base_uri '"+this.baseURI+"' from cookie");
      }
      $http.get(baseURI+"/").success(function() {
          setReachability(true);
      });
    };

    var setReachability = function setReachability(online) {
      if (data.online && !online) {
        $interval.cancel(healthInterval);
        $interval.cancel(statusInterval);
        $log.warn("Cluster is offline.");
        data.online = false;
        data.status = '--';
        data.tableInfo = null;
        data.cluster = {};
        data.name = '--';
        data.load = ['-.-', '-.-', '-.-'],
        data.loadHistory = [[],[],[]];
        reachabilityInterval = $interval(checkReachability, refreshInterval);
      } else if (!data.online && online) {
        $interval.cancel(reachabilityInterval);
        $log.info("Cluster is online.");
        data.online = true;
        healthInterval = $interval(refreshHealth, refreshInterval);
        statusInterval = $interval(refreshState, refreshInterval);
      }
    }

    var addToLoadHistory = function(load) {
      if (load.length != data.loadHistory.length) return;
      var lh = data.loadHistory;
      for (var i=0; i<load.length; i++) {
          lh[i].push(load[i]);
          lh[i] = lh[i].splice(-historyLength, historyLength);
      }
    };

    var refreshHealth = function() {
      if (!data.online) return;
      
      var clusterQuery = SQLQuery.execute(
        'select id, name, hostname, port, load, mem, fs from sys.nodes');
      clusterQuery.success(function(sqlQuery) {
        data.cluster = $.map(sqlQuery.rows, function(obj, idx){
          return _object(['id', 'name', 'hostname', 'port', 'load', 'mem', 'fs'], obj);
        });
      }).error(function(sqlQuery) {
        setReachability(false);
      });

      var tableQuery = SQLQuery.execute(
        'select table_name, sum(number_of_shards), number_of_replicas ' +
        'from information_schema.tables ' +
        'where schema_name = \'doc\' group by table_name, number_of_replicas');

      var shardQuery = SQLQuery.execute(
        'select table_name, count(*), "primary", state, sum(num_docs), avg(num_docs), sum(size) ' +
        'from sys.shards group by table_name, "primary", state');

      tableQuery.success(function(sqlQuery){
        var tableInfo = queryResultToObjects(sqlQuery,
          ['name', 'number_of_shards', 'number_of_replicas']);

        shardQuery.success(function(sqlQuery){
          var shardInfo = queryResultToObjects(sqlQuery, 
            ['name', 'count', 'primary', 'state', 'sum_docs', 'avg_docs', 'size']);
          data.shardInfo = shardInfo;

          var numActivePrimary = shardInfo.filter(function(obj){
            return (obj.state in {"STARTED":"","RELOCATING":""} && obj.primary === true);
          }).reduce(function(memo, obj, idx){
            return memo + obj.count;
          }, 0);

          var unassigned = shardInfo.filter(function(obj){
            return obj.state === "UNASSIGNED";
          });
          var numUnassigned = unassigned.reduce(function(memo, obj, idx) {
            return memo + obj.count;
          }, 0);

          var numConfigured = tableInfo.reduce(function(memo, obj, idx) {
            return memo + obj.number_of_shards;
          }, 0);

          data.tableInfo = {
            'tables': tableInfo,
            'numActivePrimary': numActivePrimary,
            'numUnassigned': numUnassigned,
            'numConfigured': numConfigured,
            'numMissing': Math.max(numConfigured-numActivePrimary, 0)
          };

          if (numActivePrimary < numConfigured) {
            data.status = 'critical';
          } else if (numUnassigned > 0) {
            data.status = 'warning';
          } else {
            data.status = 'good';
          }

        }).error(function(){
          setReachability(false);
        });

      }).error(function(){
          setReachability(false);
      });
    };

    var refreshState = function() {
      if (!data.online) return;

      var q = SQLQuery.execute(
          'select ' +
          '   sys.cluster.name, ' +
          '   sum(load[\'1\']), ' +
          '   sum(load[\'5\']), ' +
          '   sum(load[\'15\']), ' +
          '   count(*) ' +
          'from sys.nodes group by sys.cluster.name');
      q.success(function(sqlQuery) {
          var row = sqlQuery.rows[0];
          data.name = row[0];
          data.load = row.slice(1,4);
          var numNodes = row[4];
          for (var i=0; i<data.load.length; i++) data.load[i] /= parseFloat(numNodes);
          addToLoadHistory(data.load);
      }).error(function(sqlQuery) {
        setReachability(false);
      });
    };

    refreshHealth();
    healthInterval = $interval(refreshHealth, refreshInterval);

    refreshState();
    statusInterval = $interval(refreshState, refreshInterval);

    return {
      data: data
    };
  });
