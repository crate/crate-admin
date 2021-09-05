describe('MonitoringPollService', function() {
  'use strict';
  var mockPollService;

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
      mockPollService = $injector.get('MonitoringPollService');
    });
  });

  describe('MonitoringPollService test', function() {
    it('should create null serie array', inject(function(MonitoringPollService) { //jshint ignore:line
      var response = [{
        last_timestamp: 1485341758522,
        ended_time: 1485341754000,
        qps: 6,
        duration: 0.3333333333333333,
        query_type: 'SELECT'
      }, {
        last_timestamp: 1485341758522,
        ended_time: 1485341754000,
        qps: 1,
        duration: 1.3,
        query_type: 'UPDATE'
      }];
      mockPollService.formatData(mockPollService.data, response);
      expect(mockPollService.data.qps[0].values.length).toEqual(1);
      expect(mockPollService.data.qps[0].values[0]).toEqual({
        x: 1485341754000,
        y: 6
      });

      expect(mockPollService.data.qps[2].values.length).toEqual(1);
      expect(mockPollService.data.qps[2].values[0]).toEqual({
        x: 1485341754000,
        y: 1
      });

      expect(mockPollService.data.qps[4].values.length).toEqual(1);
      expect(mockPollService.data.qps[4].values[0]).toEqual({
        x: 1485341754000,
        y: 7
      });

      expect(mockPollService.data.duration[0].values.length).toEqual(1);
      expect(mockPollService.data.duration[0].values[0]).toEqual({
        x: 1485341754000,
        y: 0.3333333333333333
      });

      expect(mockPollService.data.duration[2].values.length).toEqual(1);
      expect(mockPollService.data.duration[2].values[0]).toEqual({
        x: 1485341754000,
        y: 1.3
      });

      expect(mockPollService.data.duration[4].values.length).toEqual(1);
      expect(mockPollService.data.duration[4].values[0]).toEqual({
        x: 1485341754000,
        y: 1.6333333333333333
      });
    }));
  });

});
