'use strict';

angular.module('overview', ['stats'])
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
  .controller('OverviewController', function($scope, $location, $log, $timeout, ClusterState, HistoryChart, ZeroArray) {
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

    $scope.$watch(function() { return ClusterState.data; }, function (data) {
      var now = new Date().getTime();
      if (lastUpdate && now - lastUpdate < 100) {
        return;
      } else {
        lastUpdate = now;
      }

      $scope.checks = data.checks;

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

      if ($scope.records_total > 0) {
        $scope.replicated_data = Math.max(0, $scope.records_total-$scope.records_underreplicated) / $scope.records_total * 100.0;
        $scope.available_data = Math.max(0, $scope.records_total-$scope.records_unavailable) / $scope.records_total * 100.0;
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

    $scope.refreshClusterCheck = function refreshClusterCheck() {
      ClusterState.refreshClusterCheck();
    };

    // bind tooltips
    $("[rel=tooltip]").tooltip({ placement: 'top'});

  })
