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
          data.status = '--';
          data.tables = [];
        }
      });
    };

    var refreshState = function() {
      if (!data.online) return;

      var clusterQuery = SQLQuery.execute(
        'select id, name, hostname, rest_url, port, load, heap, fs, version from sys.nodes');
      clusterQuery.success(function(sqlQuery) {
        data.cluster = queryResultToObjects(sqlQuery,
            ['id', 'name', 'hostname', 'rest_url', 'port', 'load', 'heap', 'fs', 'version']);
      }).error(function(sqlQuery) {
        var status = sqlQuery.error.status;
        if (status === 0 || status === 404) setReachability(false);
      });

      var q = SQLQuery.execute(
          'select ' +
          '   sum(load[\'1\']), ' +
          '   sum(load[\'5\']), ' +
          '   sum(load[\'15\']), ' +
          '   count(*) ' +
          'from sys.nodes');
      q.success(function(sqlQuery) {
          var row = sqlQuery.rows[0];
          data.load = row.slice(0,3);
          var numNodes = parseFloat(row[3]);
          for (var i=0; i<data.load.length; i++) data.load[i] /= numNodes;
          addToLoadHistory(data.load);
      }).error(function(sqlQuery) {
          var status = sqlQuery.error.status;
          if (status === 0 || status === 404) setReachability(false);
      });

      var clusterName = SQLQuery.execute('select name from sys.cluster');
      clusterName.success(function(sqlQuery) {
          var row = sqlQuery.rows[0];
          data.name = row[0]
      }).error(function(sqlQuery) {
          var status = sqlQuery.error.status;
          if (status === 0 || status === 404) setReachability(false);
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
