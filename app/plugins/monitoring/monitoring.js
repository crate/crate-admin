/*
 * This file is part of a module with proprietary Enterprise Features.
 *
 * Licensed to Crate.io Inc. ("Crate.io") under one or more contributor 
 * license agreements.  See the NOTICE file distributed with this work for
 * additional information regarding copyright ownership.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 *
 * To use this file, Crate.io must have given you permission to enable and
 * use such Enterprise Features and you must have a valid Enterprise or
 * Subscription Agreement with Crate.io.  If you enable or use the Enterprise
 * Features, you represent and warrant that you have a valid Enterprise or
 * Subscription Agreement with Crate.io.  Your use of the Enterprise Features
 * if governed by the terms and conditions of your Enterprise or Subscription
 * Agreement with Crate.io.
 */
'use strict';

angular.module('monitoring', [])
  .factory('StatsCheckingQuery', function(SQLQuery, queryResultToObjects, $q) {
    var statsCheckingService = {
      deferred: $q.defer()
    };

    var stmt = 'SELECT settings[\'stats\'][\'enabled\'] AS stats_enabled FROM sys.cluster;';

    var cols = ['stats_enabled'];

    statsCheckingService.execute = function() {
      var deferred = $q.defer(),
        promise = deferred.promise;
      SQLQuery.execute(stmt, {}, false, false, true)
        .success(function(query) {
          var result = queryResultToObjects(query, cols);
          deferred.resolve(result);
        })
        .error(function() {
          deferred.reject();
        });

      return promise;
    };

    return statsCheckingService;
  })
  .factory('StatsCheckingService', function(StatsCheckingQuery, $timeout, $q, $rootScope) {
    var statsCheckingService = {
      'stats_enabled': -1
    };

    var retryCount = 0;
    var poll = function(force) {
      $q.when(StatsCheckingQuery.execute())
        .then(function(response) {
          statsCheckingService.stats_enabled = response[0].stats_enabled ? 1 : 0;
          $rootScope.$broadcast('stats-checking-query-done');
          retryCount = 0;
          if (force !== true) {
            $timeout(poll, 60000);
          }
        }).catch(function() {
          statsCheckingService.stats_enabled = -1;
          $rootScope.$broadcast('stats-checking-query-done');
          retryCount++;
          if (force !== true) {
            $timeout(poll, 60000 * retryCount);
          }
        });
    };
    // Initial poll
    $timeout(poll, 2000);
    statsCheckingService.refresh = function() {
      poll(true);
    };
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
        'DATE_TRUNC(\'second\', ended) AS ended_time, ' +
        'COUNT(*) AS qps, ' +
        'AVG(ended - started) AS duration, ' +
        'UPPER(regexp_matches(stmt,\'^\\s*(\\w+).*\')[1]) AS query_type ' +
        'FROM sys.jobs_log ' +
        'WHERE DATE_TRUNC(\'second\', ended) BETWEEN ' + String(last_timestamp || 'CURRENT_TIMESTAMP - 180000') +
        ' - 20000 AND CURRENT_TIMESTAMP - 20000 ' +
        'GROUP BY 1, 2, 5 ORDER BY ended_time ASC';
    };
    var cols = ['last_timestamp', 'ended_time', 'qps', 'duration', 'query_type'];

    monitoringService.execute = function(last_timestamp) {
      var deferred = $q.defer(),
        promise = deferred.promise;
      SQLQuery.execute(monitoringService.get_statement(last_timestamp), {}, false, false, true)
        .success(function(query) {
          var result = queryResultToObjects(query, cols);
          deferred.resolve(result);
        })
        .error(function(response) {
          deferred.reject(response);
        });

      return promise;
    };

    return monitoringService;
  })
  .factory('MonitoringPollService', function($timeout, $q, MonitoringQueryService, $rootScope, NullSerie, NullOverAllSeries) {
    var pollService = {
      options: {
        MAX_VALUE_LENGTH: 60,
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
      response.forEach(function(element) {
        if (Object.keys(pollService.options.QUERY_TYPES).indexOf(element.query_type) !== -1) {
          var query_type = pollService.options.QUERY_TYPES[element.query_type];
          data.qps[query_type].values.push({
            'x': element.ended_time,
            'y': element.qps
          });
          if (data.qps[query_type].values.length > pollService.options.MAX_VALUE_LENGTH) {
            data.qps[query_type].values.shift();
          }
          data.duration[query_type].values.push({
            'x': element.ended_time,
            'y': element.duration
          });
          if (data.duration[query_type].values.length > pollService.options.MAX_VALUE_LENGTH) {
            data.duration[query_type].values.shift();
          }
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
    var poll = function(force) {
      $q.when(MonitoringQueryService.execute(pollService.options.last_timestamp))
        .then(function(response) {
          pollService.formatData(pollService.data, response);
          if (response.length) {
            pollService.options.last_timestamp = response[0].last_timestamp;
          }
          $rootScope.$broadcast('monitoring-service-query-success');
          retryCount = 0;
          if (force !== true) {
            $timeout(poll, 5000);
          }
        }).catch(function(response) {
          if (response.error && response.error.status == '4011') {
            $rootScope.$broadcast('monitoring-user-has-no-access');
          }
          retryCount++;
          if (force !== true) {
            $timeout(poll, 1000 * retryCount);
          }
        });
    };
    // Initial poll
    $timeout(poll, 2000);
    pollService.refresh = function() {
      poll(true);
    };

    return pollService;
  })
  .controller('MonitoringController', function($scope, MonitoringPollService, $translatePartialLoader, $translate, StatsCheckingService) {
    $scope.qps = [];
    $scope.duration = [];
    $scope.user_has_access = false;

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

    $scope.$on('monitoring-service-query-success', function() {
      $scope.qps = MonitoringPollService.data.qps;
      $scope.duration = MonitoringPollService.data.duration;
      $scope.user_has_access = true;
    });

    $scope.$on('monitoring-user-has-no-access', function() {
      $scope.user_has_access = false;
    });

    $scope.$on('monitoring-service-query-success', function() {
      $scope.qps = MonitoringPollService.data.qps;
      $scope.duration = MonitoringPollService.data.duration;
    });

    $scope.$on('stats-checking-query-done', function() {
      $scope.stats_enabled = StatsCheckingService.stats_enabled;
    });

    MonitoringPollService.refresh();
    StatsCheckingService.refresh();
    $translatePartialLoader.addPart('./plugins/monitoring');
    $translate.refresh();
  })
  .run(function($window, NavigationService, $translatePartialLoader, $filter, $rootScope, $translate) {
    $translatePartialLoader.addPart('./plugins/monitoring');
    $translate.refresh();
    var iconSrc = 'plugins/monitoring/static/icons/icon-monitoring.svg';
    var url = '/monitoring';
    var position = 4;

    NavigationService.addNavBarElement(iconSrc, 'Monitoring', url, position);
  });
