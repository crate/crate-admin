describe('Health', function() {
  'use strict';

  var mockHealthService;

  beforeEach(angular.mock.module('common'));
  beforeEach(angular.mock.module('crate'));
  beforeEach(angular.mock.module('health'));
  beforeEach(function() {
    angular.mock.inject(function($injector) {
      mockHealthService = $injector.get('Health');
    });
  });

  describe('mockHealthService', function() {

    it('should return 0', inject(function() {
      var health = mockHealthService.fromString('good');
      expect(health.name).toEqual("good");
      expect(health.level).toEqual(0);

    }));


    it('should return 1', inject(function() {
      var health = mockHealthService.fromString('warning');
      expect(health.name).toEqual("warning");
      expect(health.level).toEqual(1);

    }));


    it('should return 2', inject(function() {
      var health = mockHealthService.fromString('critical');
      expect(health.name).toEqual("critical");
      expect(health.level).toEqual(2);

    }));

    it('should return 2', inject(function() {
      var health = mockHealthService.fromString('something');
      expect(health.name).toEqual("--");
      expect(health.level).toEqual(-1);

    }));

  });

});
