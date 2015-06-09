'use strict';

angular.module('overview', ['stats'])
  .controller('OverviewController', function ($scope, $location, $log, $timeout, ClusterState) {

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
      'maxY': 1.0
    };

    $scope.$watch(function() { return ClusterState.data; }, function (data) {
      var now = new Date().getTime();
      if (lastUpdate && now - lastUpdate < 100) {
        return;
      } else {
        lastUpdate = now;
      }

      $scope.cluster_state = data.status;
      $scope.cluster_color_class = colorMap[data.status];

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
      // draw graph
      if (data.loadHistory[0].length > 0) {
        drawGraph(data.loadHistory);
      }
    }, true);

    function fillArrayWithZeroes(len) {
      var res = new Array(len);
      for (var i=0; i<res.length; i++) {
        res[i] = 0;
      }
      return res;
    };

    var drawGraph = function drawGraph(history) {
      var len = history[0].length;

      // Create Arrays with Zeroes in it
      var data = [
        fillArrayWithZeroes(ClusterState.HISTORY_LENGTH-len),
        fillArrayWithZeroes(ClusterState.HISTORY_LENGTH-len),
        fillArrayWithZeroes(ClusterState.HISTORY_LENGTH-len)
      ];

      for (var i=0; i<data.length; i++){
        data[i].push.apply(data[i], history[i]);
      }

      var labels = new Array(ClusterState.HISTORY_LENGTH);
      for (var i=0; i<labels.length; i++) {
        labels[i] = i;
      }

      // Get the max value out of the history
      var maxY = Math.max(
        Math.max.apply(Math, data[0]),
        Math.max.apply(Math, data[1]),
        Math.max.apply(Math, data[2])
      );

      var graphData = [[], [], []];

      for (var i=0; i<ClusterState.HISTORY_LENGTH; i++) {
        graphData[0][i] = [labels[i], data[0][i]];
        graphData[1][i] = [labels[i], data[1][i]];
        graphData[2][i] = [labels[i], data[2][i]];
      }

      var chart = d3.select('#history-chart svg');

      $scope.chart.y = [0, Math.round(Math.max(maxY+0.2, 1.0)*10)/10];
      $scope.chart.data = [
      {
        "key": "Load 1",
        "values": graphData[0],
        "color": "#55d4f5",
        "area": true
      },
      {
        "key": "Load 5",
        "values": graphData[1],
        "color": "#5987ff"
      },
      {
        "key": "Load 15",
        "values": graphData[2],
        "color": "#115097"
      }];
    };

    // bind tooltips
    $("[rel=tooltip]").tooltip({ placement: 'top'});

  });
