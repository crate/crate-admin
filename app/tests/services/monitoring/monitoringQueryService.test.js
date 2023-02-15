describe('monitoring', function() {
  'use strict';

  var MonitoringQueryService, $q;

  beforeEach(function() {
    angular.mock.module(function($provide) {
      $provide.value('SQLQuery', {
        execute: function() {
          return 'execute';
        }
      });
      $provide.value('NavigationService', {
        addNavBarElement: function() {
          return 'addNavBarElement';
        }
      });
      $provide.value('$translatePartialLoader', {
        addPart: function() {
          return 'addPart';
        }
      });
      $provide.value('$translate', {
        refresh: function() {
          return 'refresh';
        }
      });
      $provide.value('queryResultToObjects',
        function() {
          return 'queryResultToObjects';
        }
      );
    });
    angular.mock.module('crate');
    angular.mock.module('overview');
    angular.mock.inject(function($injector) {
      $q = $injector.get('$q');
      MonitoringQueryService = $injector.get('MonitoringQueryService');
    });
  });

  describe('MonitoringQueryService Tests', function() {
    it('should return statement with last_timestamp = CURRENT_TIMESTAMP - 10000', inject(function() {
      var stmt;
      stmt = MonitoringQueryService.get_statement();

      expect(stmt).toEqual('SELECT CURRENT_TIMESTAMP AS last_timestamp, ' +
      '(ended / 10000) * 10000 + 5000 AS ended_time, ' +
      'COUNT(*) / 10.0 AS qps, ' +
      'AVG(ended::bigint - started::bigint) AS duration, ' +
      'UPPER(regexp_matches(stmt,\'^\\s*(\\w+).*\')[1]) AS query_type ' +
      'FROM sys.jobs_log ' +
      'WHERE ended > now() - (\'15 minutes\')::interval ' +
      'GROUP BY 1, 2, 5 ORDER BY ended_time ASC');
    }));
  });
});
