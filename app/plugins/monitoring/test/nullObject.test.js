describe('NullOverAllSeries', function() {
  'use strict';
  var mockNullOverAllSeries;

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
      mockNullOverAllSeries = $injector.get('NullOverAllSeries');
    });
  });

  describe('NullOverAllSeries test', function() {
    it('should create null serie object', inject(function(NullOverAllSeries) { //jshint ignore:line
      var output =  mockNullOverAllSeries.create(50);
      var keys = Object.keys(output);

      expect(output[keys[0]]).toEqual(null);
    }));
  });

});
