'use strict';

angular.module('overview', ['stats', 'checks', 'ngSanitize'])
  .factory('NullArray', function() {
    return function NullArray(len) {
      var res = new Array(len);
      for (var i = 0; i < res.length; i++) res[i] = null;
      return res;
    };
  })
  .controller('OverviewController', function($scope, $location, $log, $timeout, $interval, ClusterState, NullArray, ChecksService, SQLQuery) {
    var lastUpdate = null;
    var colorMap = {
      "good": 'cr-panel--success',
      "warning": 'cr-panel--warning',
      "critical": 'cr-panel--danger',
      '--': 'cr-panel--default'
    };
    var chartConf = [{
      "key": "Load 1",
      "color": "#5bd5f5",
      "area": true
    }, {
      "key": "Load 5",
      "color": "#5d89fe"
    }, {
      "key": "Load 15",
      "color": "#115097"
    }];
    var chartCache = [[], [], []];

    $scope.available_data = '--';
    $scope.records_unavailable = '--';
    $scope.replicated_data = '--';
    $scope.records_total = '--';
    $scope.records_underreplicated = '--';
    $scope.cluster_state = '--';
    $scope.cluster_color_class = 'cr-panel--default';
    $scope.chart = {
      data: [],
      toggleLoad: function(e, idx) {
        $('span span', e.originalTarget).toggleClass('cr-radio-button__load__toggle--inactive');
        $('#cluster-load .nv-series-' + idx).toggle();
      }
    };

    $scope.$watch(function() { return ChecksService; }, function(data) {
      if (data.success === true) {
        $scope.checks = data.checks;
      } else {
        $scope.checks = {node_checks: [], cluster_check: []};
      }
    }, true);

    $scope.refresh = ChecksService.refresh;

    var removeFromArray = function(arr, obj) {
      arr.splice(arr.indexOf(obj), 1);
    }

    var removeCheck = function(check) {
      removeFromArray($scope.checks.node_checks, check)
    };

    var drawGraph = function(history) {
      chartCache = history;
      var data,
          len = history[0].length; // assuming all load arrays have the same length!
      if (len < ClusterState.HISTORY_LENGTH) {
        var missing = ClusterState.HISTORY_LENGTH - len;
        data = [
          NullArray(missing),
          NullArray(missing),
          NullArray(missing)
        ];
        for (var i = 0; i < data.length; i++){
          data[i].push.apply(data[i], history[i]);
        }
      } else {
        data = history;
      }
      $scope.chart.data = data.map(function(lineData, i){
        var line = angular.copy(chartConf[i]);
        line.values = lineData.map(function(val, j) {
          return [j, val];
        });
        return line;
      });
    };

    $scope.dismissCheckByNode = function(node, check) {
      var stmt = 'UPDATE sys.node_checks SET acknowledged = TRUE WHERE node_id = ? AND id = ?';
      SQLQuery.execute(stmt, [node.id, check.id]).success(function(query) {
        removeFromArray(check.nodes, node)
        if (check.nodes.length === 0) {
          removeCheck(check);
        }
      });
    };

    $scope.dismissCheck = function(check) {
      var stmt = 'UPDATE sys.node_checks SET acknowledged = TRUE WHERE id = ?';
      SQLQuery.execute(stmt, [check.id]).success(function() {
        removeCheck(check);
      });
    };

    $scope.$watch(function() { return ClusterState.data; }, function (data) {
      var now = new Date().getTime();
      if (lastUpdate && now - lastUpdate < 100) {
        return;
      } else {
        lastUpdate = now;
      }

      $scope.cluster = {
        'name': data.name,
        'state': data.status
      };
      $scope.cluster_color_class = colorMap[data.status];

      // draw graph
      if (data.loadHistory[0].length > 0) {
        drawGraph(data.loadHistory);
      }

      if (!data.tables || !data.tables.length) {
        $scope.available_data = 100;
        $scope.records_unavailable = 0;
        $scope.replicated_data = 100;
        $scope.records_total = 0;
        $scope.records_total_with_replicas = 0;
        $scope.records_underreplicated = 0;
        return;
      };

      // Aggregate date across all tables
      var tables = data.tables;
      $scope.records_underreplicated = tables.reduce(function(memo, tableInfo, idx) {
        return tableInfo.records_underreplicated + memo;
      }, 0);
      $scope.records_unavailable = tables.reduce(function(memo, tableInfo, idx) {
        return tableInfo.records_unavailable + memo;
      }, 0);
      $scope.records_total = tables.reduce(function(memo, tableInfo, idx) {
        return tableInfo.records_total + memo;
      }, 0);

      $scope.records_total_with_replicas = tables.reduce(function(memo, tableInfo, idx) {
        return tableInfo.records_total_with_replicas + memo;
      }, 0);

      if ($scope.records_total_with_replicas > 0) {
        $scope.replicated_data = Math.max(0, $scope.records_total_with_replicas - $scope.records_underreplicated)
          / $scope.records_total_with_replicas * 100.0;

        $scope.available_data = Math.max(0, $scope.records_total_with_replicas - $scope.records_unavailable)
          / $scope.records_total_with_replicas * 100.0;
      } else {
        $scope.replicated_data = 100.0;
        $scope.available_data = 100.0;
      }
    }, true);


    // bind tooltips
    $("[rel=tooltip]").tooltip({ placement: 'top'});

    $scope.$on('$destroy', function(event) {
      window.onresize = null;
    });
  });
