'use strict';

angular.module('stats', ['sql', 'health', 'tableinfo'])
  .factory('ClusterState', function ($http, $interval, $location, $log, SQLQuery, queryResultToObjects, TableList, TableInfo, Health) {
    var healthInterval, statusInterval, reachabilityInterval;

    var data = {
      online: true,
      tables: [],
      cluster: [],
      name: '--',
      status: '--',
      load: ['-.-', '-.-', '-.-'],
      loadHistory: [[],[],[]],
      version: null
    };

    var refreshInterval = 5000;
    var historyLength = 100;

    var checkReachability = function checkReachability(){
      var baseURI = $location.protocol() + "://" + $location.host() + ":" + $location.port();
      if (localStorage.getItem("crate.base_uri") != null) {
        baseURI = localStorage.getItem("crate.base_uri");
      }
      $http.get(baseURI+"/").success(function(response) {
        var version = response.version;
        data.version = {
          'number': version.number,
          'hash': version.build_hash.substr(0,7),
          'snapshot': version.build_snapshot
        };
        setReachability(true);
      });
    };

    var setReachability = function setReachability(online) {
      if (data.online && !online) {
        data.online = false;
        $log.warn("Cluster is offline.");
        $interval.cancel(healthInterval);
        $interval.cancel(statusInterval);
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
          setReachability(false);
        }
      });
    };

    var refreshState = function() {
      if (!data.online) return;

      var clusterQuery = SQLQuery.execute(
        'select id, name, hostname, port, load, heap, fs, version from sys.nodes');
      clusterQuery.success(function(sqlQuery) {
        data.cluster = queryResultToObjects(sqlQuery,
            ['id', 'name', 'hostname', 'port', 'load', 'heap', 'fs', 'version']);
      }).error(function(sqlQuery) {
        setReachability(false);
      });

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
          var numNodes = parseFloat(row[4]);
          for (var i=0; i<data.load.length; i++) data.load[i] /= numNodes;
          addToLoadHistory(data.load);
      }).error(function(sqlQuery) {
          setReachability(false);
      });
    };

    checkReachability();

    refreshHealth();
    healthInterval = $interval(refreshHealth, refreshInterval);

    refreshState();
    statusInterval = $interval(refreshState, refreshInterval);

    return {
      data: data
    };
  });
