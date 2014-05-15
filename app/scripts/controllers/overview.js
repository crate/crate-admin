'use strict';

angular.module('overview', ['stats'])
  .controller('OverviewController', function ($scope, $location, $log, $timeout, ClusterState) {

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

    $scope.$watch(function() { return ClusterState.data; }, function (data) {
      $scope.cluster_state = data.status;
      $scope.cluster_color_class = colorMap[data.status];

      // Graph is always drawn
      drawGraph(data.loadHistory);

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

    var drawGraph = function drawGraph(history) {
      var data = [];
      for (var j=0; j<history.length; j++) {
        var lh = history[j], d = [];
        for (var i=0; i<lh.length; i++) d.push([i, lh[i]]);
        data.push(d);
      }
      $.plot($('#load-graph'), [{label: 'cluster load', data: data[0], color: '#676767'}], {
          series: {
              shadowSize: 0,
              points: { show: true }
          },
          lines: { show: true, fill: true },
          yaxis: {
              min: 0
          },
          xaxis: {
              min: 0,
              max: 100,
              show: false
          }
      }).draw();
    };

    // bind tooltips
    $("[rel=tooltip]").tooltip({ placement: 'top'});

  });
