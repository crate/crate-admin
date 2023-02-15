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
  SeverityClass, ClusterEventsHandler, StatsCheckingService, MonitoringPollService) {
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
    
    // Monitor Start
    var statsCheckingServiceInterval, monitoringPollInterval;
    $scope.qps = [];
    $scope.duration = [];
    $scope.user_has_access = null;

    $scope.toggle_qps_query_type = function(e, idx) {
      $('#qps-query-type-' + idx).toggleClass('faded-text');
      $('#qps-query-type-btn-' + idx).toggleClass('cr-radio-button__load__toggle--inactive');
      $scope.qps[idx].disabled = !$scope.qps[idx].disabled;
    };

    $scope.toggle_duration_query_type = function(e, idx) {
      $('#duration-query-type-' + idx).toggleClass('faded-text');
      $('#duration-query-type-btn-' + idx).toggleClass('cr-radio-button__load__toggle--inactive');
      $scope.duration[idx].disabled = !$scope.duration[idx].disabled;
    };


    var formatDate = function formatDate(d) {
      return d3.time.format('%H:%M:%S')(new Date(d));
    };

    $scope.qps_chart_options = {
      chart: {
        type: 'lineChart',
        height: 350,
        margin: {
          'top': 20,
          'right': 20,
          'bottom': 30,
          'left': 40
        },
        x: function(d) {
          if (d) {
            return d.x;
          }
        },
        y: function(d) {
          if (d) {
            return d.y;
          }
        },
        useInteractiveGuideline: true,
        transitionDuration: 0,
        xAxis: {
          tickFormat: function(d) {
            return formatDate(d);
          }
        },
        forceY: [0, 20],
        yAxis: {
          tickFormat: function(d) {
            if (d >= 0) {
              return d3.format('')(d);
            } else {
              return '--';
            }
          },
          ticks: 6,
          axisLabelDistance: 0,
          showMaxMin: false
        },
        showLegend: false
      }
    };
    $scope.duration_chart_options = {
      chart: {
        type: 'lineChart',
        height: 350,
        margin: {
          'top': 20,
          'right': 20,
          'bottom': 30,
          'left': 40
        },
        x: function(d) {
          if (d) {
            return d.x;
          }
        },
        y: function(d) {
          if (d) {
            return d.y;
          }
        },
        useInteractiveGuideline: true,
        transitionDuration: 0,
        xAxis: {
          tickFormat: function(d) {
            return formatDate(d);
          }
        },
        forceY: [0, 5],
        yAxis: {
          tickFormat: function(d) {
            if (d >= 0) {
              return Math.round(d * 100) / 100;
            } else {
              return '--';
            }
          },
          ticks: 6,
          axisLabelDistance: 0,
          showMaxMin: false
        },
        showLegend: false
      }
    };

    statsCheckingServiceInterval = $interval(StatsCheckingService.refresh, 5000);
    monitoringPollInterval = $interval(MonitoringPollService.refresh, 5000);

    ClusterEventsHandler.register('STATS_QUERY_REFRESHED', 'OverviewController', function () {
      $scope.stats_enabled = StatsCheckingService.stats_enabled;
    });

    ClusterEventsHandler.register('MONITORING_USER_NO_ACCESS', 'OverviewController', function () {
      $scope.user_has_access = false;
    });

    ClusterEventsHandler.register('MONITORING_SERVICE_QUERY_SUCCESS', 'OverviewController', function () {
      $scope.qps = MonitoringPollService.data.qps;
      $scope.duration = MonitoringPollService.data.duration;
      $scope.user_has_access = true;
    });
    // Monitor End
    
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
      ClusterEventsHandler.remove('STATS_QUERY_REFRESHED', 'OverviewController');
      ClusterEventsHandler.remove('MONITORING_SERVICE_QUERY_SUCCESS', 'OverviewController');
      ClusterEventsHandler.remove('MONITORING_USER_NO_ACCESS', 'OverviewController');
      $interval.cancel(statsCheckingServiceInterval);
      $interval.cancel(monitoringPollInterval);
    });
  })
  // Monitoring
  .factory('StatsCheckingService', function(SQLQuery, queryResultToObjects, $timeout, $q, ClusterEventsHandler) {
    var statsCheckingService = {
      'stats_enabled': -1
    };

    var stmt = 'SELECT settings[\'stats\'][\'enabled\'] AS stats_enabled FROM sys.cluster;';

    var cols = ['stats_enabled'];

    var poll = function() {
      SQLQuery.execute(stmt, {}, false, false, true, false)
        .then(function(response) {
          statsCheckingService.stats_enabled = queryResultToObjects(response, cols)[0].stats_enabled ? 1 : 0;
        }).catch(function() {
          statsCheckingService.stats_enabled = -1;
        }).finally(function(){
          ClusterEventsHandler.trigger('STATS_QUERY_REFRESHED');
        });
    };
    statsCheckingService.refresh = poll;
    return statsCheckingService;
  })
  .factory('NullSerie', function() {
    return {
      create: function(len) {
        var res = new Array(len);
        for (var i = 0; i < res.length; i++) {
          res[i] = {
            'x': Date.now() - 100000 + i,
            'y': null
          };
        }
        return res;
      }
    };
  })
  .factory('NullOverAllSeries', function() {
    return {
      create: function(len) {
        var res = {};
        for (var i = 0; i < len; i++) {
          res[(Date.now() - 100000 + i)] = null;
        }
        return res;
      }
    };
  })
  .factory('MonitoringQueryService', function(SQLQuery, queryResultToObjects, $q) {
    var monitoringService = {
      deferred: $q.defer()
    };

    monitoringService.get_statement = function(last_timestamp) {
      return 'SELECT CURRENT_TIMESTAMP AS last_timestamp, ' +
        '(ended / 10000) * 10000 + 5000 AS ended_time, ' +
        'COUNT(*) / 10.0 AS qps, ' +
        'AVG(ended::bigint - started::bigint) AS duration, ' +
        'UPPER(regexp_matches(stmt,\'^\\s*(\\w+).*\')[1]) AS query_type ' +
        'FROM sys.jobs_log ' +
        'WHERE ended > now() - (\'15 minutes\')::interval ' +
        'GROUP BY 1, 2, 5 ORDER BY ended_time ASC';
    };
    var cols = ['last_timestamp', 'ended_time', 'qps', 'duration', 'query_type'];

    monitoringService.execute = function(last_timestamp) {
      var deferred = $q.defer(),
        promise = deferred.promise;
      SQLQuery.execute(monitoringService.get_statement(last_timestamp), {}, false, false, true, false)
        .then(function(query) {
          var result = queryResultToObjects(query, cols);
          deferred.resolve(result);
        },function(response) {
          deferred.reject(response);
        });

      return promise;
    };

    return monitoringService;
  })
  .factory('MonitoringPollService', function($timeout, $q, MonitoringQueryService, $rootScope, 
    NullSerie, NullOverAllSeries, ClusterEventsHandler) {
    var pollService = {
      options: {
        MAX_VALUE_LENGTH: 100,
        QUERY_TYPES: {
          'SELECT': 0,
          'INSERT': 1,
          'UPDATE': 2,
          'DELETE': 3
        },
        last_timestamp: 0,
      }
    };
    pollService.data = {
      qps: {},
      duration: {},
      over_all_qps: NullOverAllSeries.create(pollService.options.MAX_VALUE_LENGTH),
      over_all_duration: NullOverAllSeries.create(pollService.options.MAX_VALUE_LENGTH)
    };

    pollService.formatData = function(data, response) {
      data.qps.forEach(type => type.values = []);
      data.duration.forEach(type => type.values = []);
      data.over_all_qps = {};
      data.over_all_duration = {};

      response.forEach(function(element) {
        if (Object.keys(pollService.options.QUERY_TYPES).indexOf(element.query_type) !== -1) {
          var query_type = pollService.options.QUERY_TYPES[element.query_type];
          data.qps[query_type].values.push({
            'x': element.ended_time,
            'y': element.qps
          });
          data.duration[query_type].values.push({
            'x': element.ended_time,
            'y': element.duration
          });
        }
        data.over_all_duration[element.ended_time] = (data.over_all_duration[element.ended_time] || 0) + element.duration;
        data.over_all_qps[element.ended_time] = (data.over_all_qps[element.ended_time] || 0) + element.qps;
      });

      function formatOverAllData(data_array) {
        var output = [];
        for (var item in data_array) {
          output.push({
            'x': parseInt(item),
            'y': data_array[item]
          });
          if (output.length > pollService.options.MAX_VALUE_LENGTH) {
            output.shift();
          }
        }
        return output;
      }
      data.duration[4].values = formatOverAllData(data.over_all_duration);
      data.qps[4].values = formatOverAllData(data.over_all_qps);
    };
    pollService.data.qps = [{
      key: 'SELECT',
      color: '#5987ff',
      values: NullSerie.create(pollService.options.MAX_VALUE_LENGTH),
      disabled: false
    }, {
      key: 'INSERT',
      color: '#55d4f5',
      values: [],
      disabled: false
    }, {
      key: 'UPDATE',
      color: '#e0d838',
      values: [],
      disabled: false
    }, {
      key: 'DELETE',
      color: '#ff99a7',
      values: [],
      disabled: false
    }, {
      key: 'OVERALL',
      color: '#00ff9b',
      values: [],
      disabled: false
    }];

    pollService.data.duration = [{
      key: 'SELECT',
      color: '#5987ff',
      values: NullSerie.create(pollService.options.MAX_VALUE_LENGTH),
      disabled: false
    }, {
      key: 'INSERT',
      color: '#55d4f5',
      values: [],
      disabled: false
    }, {
      key: 'UPDATE',
      color: '#e0d838',
      values: [],
      disabled: false
    }, {
      key: 'DELETE',
      color: '#ff99a7',
      values: [],
      disabled: false
    }, {
      key: 'OVERALL',
      color: '#00ff9b',
      values: [],
      disabled: false
    }];

    var retryCount = 0;
    var poll = function() {
      $q.when(MonitoringQueryService.execute(pollService.options.last_timestamp))
        .then(function(response) {
          pollService.formatData(pollService.data, response);
          if (response.length) {
            pollService.options.last_timestamp = response[0].last_timestamp;
          }
          ClusterEventsHandler.trigger('MONITORING_SERVICE_QUERY_SUCCESS');
          retryCount = 0;
        }).catch(function(response) {
          if (response.error && response.error.status == '4011') {
            ClusterEventsHandler.trigger('MONITORING_USER_NO_ACCESS');
          }
        });
    };

    pollService.refresh = function() {
      poll(true);
    };

    return pollService;
  })
