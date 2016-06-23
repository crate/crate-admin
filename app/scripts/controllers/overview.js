'use strict';

angular.module('overview', ['stats', 'checks', 'ngSanitize'])
  .factory('ZeroArray', function() {
    return function ZeroArray(len) {
      var res = new Array(len);
      for (var i=0; i<res.length; i++) {
        res[i] = 0;
      }
      return res;
    };
  })
  .factory('HistoryChart', function() {
    return function HistoryChart(size){
      var _data = [{
          "key": "Load 1",
          "values": [],
          "color": "#55d4f5",
          "area": true
        }, {
          "key": "Load 5",
          "values": [],
          "color": "#5987ff"
        }, {
          "key": "Load 15",
          "values": [],
          "color": "#115097"
        }];
      this.size = size;
      this.data = function(){
        return _data;
      };
      this.update = function(data){
        var graphData = [[], [], []];
        for (var i=0; i<this.size; i++) {
          graphData[0][i] = [i, data[0][i]];
          graphData[1][i] = [i, data[1][i]];
          graphData[2][i] = [i, data[2][i]];
        }
        for (var i=0; i<graphData.length; i++) {
          _data[i].values = graphData[i];
        }
        return this;
      };
    };
  })
  .controller('OverviewController', function($scope, $location, $log, $timeout, $interval, ClusterState, HistoryChart, ZeroArray, ChecksService, SQLQuery) {
    var lastUpdate = null;
    var colorMap = {
      "good": 'panel-success',
      "warning": 'panel-warning',
      "critical": 'panel-danger',
      '--': 'panel-default'
    };

    $scope.available_data = '--';
    $scope.records_unavailable = '--';
    $scope.replicated_data = '--';
    $scope.records_total = '--';
    $scope.records_underreplicated = '--';
    $scope.cluster_state = '--';
    $scope.cluster_color_class = 'panel-default';
    $scope.chart = {
      'data': [],
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

    // create chart instance that holds meta information and data
    var chart = new HistoryChart(ClusterState.HISTORY_LENGTH);

    var drawGraph = function drawGraph(history) {
      var len = history[0].length;
      // Create Arrays with Zeroes in it
      var data = [
        ZeroArray(ClusterState.HISTORY_LENGTH-len),
        ZeroArray(ClusterState.HISTORY_LENGTH-len),
        ZeroArray(ClusterState.HISTORY_LENGTH-len)
      ];
      for (var i=0; i<data.length; i++){
        data[i].push.apply(data[i], history[i]);
      }
      $scope.chart.data = chart.update(data).data();
    };


    // bind tooltips
    $("[rel=tooltip]").tooltip({ placement: 'top'});

  });
