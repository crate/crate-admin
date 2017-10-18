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
    angular.mock.module('monitoring');
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
        'DATE_TRUNC(\'second\', ended) AS ended_time, ' +
        'COUNT(*) AS qps, ' +
        'AVG(ended - started) AS duration, ' +
        'UPPER(regexp_matches(stmt,\'^\\s*(\\w+).*\')[1]) AS query_type ' +
        'FROM sys.jobs_log ' +
        'WHERE DATE_TRUNC(\'second\', ended) BETWEEN CURRENT_TIMESTAMP - 180000::timestamp' +
        ' - 20000::timestamp AND CURRENT_TIMESTAMP - 20000::timestamp ' +
        'GROUP BY 1, 2, 5 ORDER BY ended_time ASC');
    }));

    it('should return statement with last_timestamp = 1485251382', inject(function() {
      var stmt;
      stmt = MonitoringQueryService.get_statement(1485251382);

      expect(stmt).toEqual('SELECT CURRENT_TIMESTAMP AS last_timestamp, ' +
        'DATE_TRUNC(\'second\', ended) AS ended_time, ' +
        'COUNT(*) AS qps, ' +
        'AVG(ended - started) AS duration, ' +
        'UPPER(regexp_matches(stmt,\'^\\s*(\\w+).*\')[1]) AS query_type ' +
        'FROM sys.jobs_log ' +
        'WHERE DATE_TRUNC(\'second\', ended) BETWEEN 1485251382 - 20000::timestamp ' +
        'AND CURRENT_TIMESTAMP - 20000::timestamp ' +
        'GROUP BY 1, 2, 5 ORDER BY ended_time ASC');
    }));
  });
});
