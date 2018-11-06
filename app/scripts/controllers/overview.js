'use strict';

import '../services/stats';
import '../services/checks';
import '../services/clusterEventsHandler';
import '../filter/numbers';
import '../filter/text';

angular.module('overview', ['stats', 'checks', 'ngSanitize', 'events', 'filters_numbers', 'filters_text'])
  .factory('NullArray', function() {
    return {
      create: function(len) {
        var res = new Array(len);
        for (var i = 0; i < res.length; i++) {
          res[i] = null;
        }
        return res;
      }
    };
  })
  .controller('OverviewController', function($scope, $location, $log, $timeout, $interval, ClusterState, NullArray, ChecksService, SQLQuery, 
  SeverityClass, ClusterEventsHandler) {
    var colorMap = {
      'good': 'cr-panel--success',
      'warning': 'cr-panel--warning',
      'critical': 'cr-panel--danger',
      '--': 'cr-panel--default'
    };
    var chartConf = [{
      'key': 'Load 1',
      'color': '#5bd5f5',
      'area': true
    }, {
      'key': 'Load 5',
      'color': '#5d89fe'
    }, {
      'key': 'Load 15',
      'color': '#44e3a6'
    }];

    $scope.severityClass = SeverityClass;
    $scope.options = {
      chart: {
        type: 'lineChart',
        height: 350,
        margin: {
          'top': 20,
          'right': 2,
          'bottom': 10,
          'left': 40
        },
        showXAxis: false,
        showYAxis: true,
        showLegend: false,
        tooltip: {
          enabled: false
        },
        yAxis: {
          tickFormat: function(d) {
            return d3.format('.2f')(d);
          },
          axisLabelDistance: -10,
          showMaxMin: false
        },
        dispatch: {
          renderEnd: function () {
            $scope.api.update();
          }
        }
      }
    };
    var chartCache = [
      [],
      [],
      []
    ];

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
        $('#load-btn-' + idx).toggleClass('cr-radio-button__load__toggle--inactive');
        $('#cluster-load .nv-series-' + idx).toggle();
      }
    };

    $scope.refresh = function(){
      ChecksService.fetch(true);
    }

    ClusterEventsHandler.register('CHECKS_REFRESHED', 'OverviewController', function() {
      if (ChecksService.success === true) {
        $scope.checks = ChecksService.checks;
      } else {
        $scope.checks = {
          node_checks: [],
          cluster_check: []
        };
      }
    });

    //initial fetch 
    if (ChecksService.success === true) {
      $scope.checks = ChecksService.checks;
    } else {
      $scope.checks = {
        node_checks: [],
        cluster_check: []
      };
    }

    var removeFromArray = function(arr, obj) {
      arr.splice(arr.indexOf(obj), 1);
    };

    var removeCheck = function(check) {
      removeFromArray($scope.checks.node_checks, check);
    };

    var drawGraph = function(history) {
      chartCache = history;
      var data,
        len = history[0].length; // assuming all load arrays have the same length!
      if (len < ClusterState.HISTORY_LENGTH) {
        var missing = ClusterState.HISTORY_LENGTH - len;
        data = [
          NullArray.create(missing),
          NullArray.create(missing),
          NullArray.create(missing)
        ];
        for (var i = 0; i < data.length; i++) {
          data[i].push.apply(data[i], history[i]);
        }
      } else {
        data = history;
      }

      // Remove invalid load readings
      for (var l = 0; l < data.length; l++) {
        data[l] = data[l].map(function(load) {
          return load >= 0 ? load : null;
        });
      }

      $scope.chart.data = data.map(function(lineData, i) {
        var line = angular.copy(chartConf[i]);
        line.values = lineData.map(function(val, j) {
          return {
            x: j,
            y: val
          };
        });
        return line;
      });
    };

    $scope.dismissCheckByNode = function(node, check) {
      var stmt = 'UPDATE sys.node_checks SET acknowledged = TRUE WHERE node_id = ? AND id = ?';
      SQLQuery.execute(stmt, [node.id, check.id], false, false, false, false)
        .then(function() {
          removeFromArray(check.nodes, node);
          if (check.nodes.length === 0) {
            removeCheck(check);
          }
        });
    };

    $scope.config = {
      visible: true, 
      debounce: 5 
    };

    $scope.dismissCheck = function(check) {
      var stmt = 'UPDATE sys.node_checks SET acknowledged = TRUE WHERE id = ?';
      SQLQuery.execute(stmt, [check.id], false, false, false, false)
        .then(function() {
          removeCheck(check);
        });
    };

    var updateClusterData = function() {
      $scope.cluster = {
        'name': ClusterState.data.name,
        'state': ClusterState.data.status
      };
      $scope.cluster_color_class = colorMap[ClusterState.data.status];

      // draw graph
      if (ClusterState.data.loadHistory[0].length > 0) {
        drawGraph(ClusterState.data.loadHistory);
      }

      if (!ClusterState.data.tables || !ClusterState.data.tables.length) {
        $scope.available_data = 100;
        $scope.records_unavailable = 0;
        $scope.replicated_data = 100;
        $scope.records_total = 0;
        $scope.records_total_with_replicas = 0;
        $scope.records_underreplicated = 0;
      }

      // Aggregate date across all tables
      var tables = ClusterState.data.tables;
      $scope.records_underreplicated = tables.reduce(function(memo, tableInfo) {
        return tableInfo.records_underreplicated + memo;
      }, 0);
      $scope.records_unavailable = tables.reduce(function(memo, tableInfo) {
        return tableInfo.records_unavailable + memo;
      }, 0);
      $scope.records_total = tables.reduce(function(memo, tableInfo) {
        return tableInfo.records_total + memo;
      }, 0);
      $scope.records_total_with_replicas = tables.reduce(function(memo, tableInfo) {
        return tableInfo.records_total_with_replicas + memo;
      }, 0);

      if ($scope.records_total_with_replicas > 0) {
        $scope.replicated_data = Math.max(0, $scope.records_total_with_replicas - $scope.records_underreplicated) / $scope.records_total_with_replicas * 100.0;
        $scope.available_data = Math.max(0, $scope.records_total_with_replicas - $scope.records_unavailable) / $scope.records_total_with_replicas * 100.0;
      } else {
        $scope.replicated_data = 100.0;
        $scope.available_data = 100.0;
      }
    };

    ClusterEventsHandler.register('STATE_REFRESHED', 'OverviewController', updateClusterData);
    updateClusterData();

    // bind tooltips
    $('[rel=tooltip]').tooltip({
      placement: 'top'
    });
    $scope.$on('$viewContentLoaded', function() {
      $timeout(function() {
        $scope.api.refresh();
      }, 100);
    });
    $scope.$on('$destroy', function() {
      $scope.api.clearElement();
      ClusterEventsHandler.remove('CHECKS_REFRESHED', 'OverviewController');
      ClusterEventsHandler.remove('STATE_REFRESHED', 'OverviewController');
    });
  });
