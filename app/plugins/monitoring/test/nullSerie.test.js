describe('NullSerie', function() {
  'use strict';
  var mockNullSerie;

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
      mockNullSerie = $injector.get('NullSerie');
    });
  });

  describe('NullSerie test', function() {
    it('should create null serie array', inject(function(NullSerie) { //jshint ignore:line
      var output =  mockNullSerie.create(50);
      expect(output.length).toEqual(50);
      expect(output[0].y).toEqual(null);
    }));
  });

});
