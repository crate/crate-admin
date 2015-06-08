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

    /*
     **************************************************************
     ******************* CHART SETTINGS ***************************
     **************************************************************
    */

    var ctx = document.getElementById('load-graph').getContext("2d");
    var lineChart = new Chart(ctx);

    // Set the line attributes
    var line15 = {
      label: "Load 15min",
      fillColor: "#F4F4F5",
      strokeColor: "#D5D5D5",
      pointColor: "#CACACA",
      pointStrokeColor: "#fff",
      data: []
    }

    var line5 = {
      label: "Load 5min",
      fillColor: "#B9B9B9",
      strokeColor: "#E1E1E1",
      pointColor: "#DADADA",
      pointStrokeColor: "#fff",
      data: []
    }

    var line1 = {
      label: "Load 1min",
      fillColor: "#CCF3DF",
      strokeColor: "#80E2B0",
      pointColor: "#00c561",
      pointStrokeColor: "#fff",
      data: []
    }

    var startValue = 0.0; // the scale start value
    var stepWidth = 0.5;  // the scale step size
    var offsetY = 0.5;    // the scale offset


    var drawGraph = function drawGraph(history) {

      // Create Arrays with Zeroes in it
      var data1 = fillArrayWithZeroes(ClusterState.HISTORY_LENGTH);
      var data5 = fillArrayWithZeroes(ClusterState.HISTORY_LENGTH);
      var data15 = fillArrayWithZeroes(ClusterState.HISTORY_LENGTH);

      for (var i=0; i<history[0].length; i++) {
        data1.shift();
        data5.shift();
        data15.shift();
      }

      data1.push.apply(data1, history[0]);
      data5.push.apply(data5, history[1]);
      data15.push.apply(data15, history[2]);

      var labels = new Array(data1.length);
      for (var i=0; i<labels.length; i++) {
        labels[i] = String(""); // Set label text here 
      }

      // Get the max value out of the history
      var max1 = Math.max.apply(Math, data1);
      var max5 = Math.max.apply(Math, data5);
      var max15 = Math.max.apply(Math, data15);

      var maxVal = Math.max.apply(Math, [max1, max5, max15]);

      // Calc the number of steps used for scaling the chart
      var numbSteps = (maxVal + offsetY) / stepWidth;

      // Append the line data
      line15.data = data15;
      line5.data = data5;
      line1.data = data1;

      var chartData = {
        labels: labels,
        datasets: [line15, line5, line1]
      };

      var theChart = lineChart.Line(chartData, {
        scaleOverride: true,
        scaleSteps: numbSteps,
        scaleStepWidth: stepWidth,
        scaleStartValue: startValue,
        animation: false, 
        responsive: true,
        bezierCurve: false,
        datasetFill: false,
        scaleShowVerticalLines: false,
        pointDot : false,
        pointHitDetectionRadius: 2,
        datasetStrokeWidth : 2,
        legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=datasets.length-1; i>=0; i--){%><li style=\"background-color:<%=datasets[i].strokeColor%>\"><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>"
      });


      var legend = theChart.generateLegend();
      $('#legend').empty();
      $('#legend').append(legend);
    };

    // bind tooltips
    $("[rel=tooltip]").tooltip({ placement: 'top'});

    function fillArrayWithZeroes(size) {
      var arr = Array.apply(null, Array(size));
      return arr.map(function (x, i) { return 0 });
    }

  });