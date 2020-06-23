describe('ColumnTypeCheck', function() {
  'use strict';

  var mockColumnTypeChecksService;

  beforeEach(angular.mock.module('common'));
  beforeEach(angular.mock.module('crate'));
  beforeEach(angular.mock.module('datatypechecks'));
  beforeEach(function() {
    angular.mock.inject(function($injector) {
      mockColumnTypeChecksService = $injector.get('ColumnTypeCheck');
    });
  });

  describe('mockColumnTypeChecksService', function() {

    it('should return true', inject(function() {
      var datatypecheck = mockColumnTypeChecksService.isGeopoint(13);
      expect(datatypecheck).toEqual(true);
    }));

    it('should return true', inject(function() {
      var datatypecheck = mockColumnTypeChecksService.isGeoarea(14);
      expect(datatypecheck).toEqual(true);
    }));

    it('should return true', inject(function() {
      var datatypecheck = mockColumnTypeChecksService.isTimestamp(11);
      expect(datatypecheck).toEqual(true);
    }));

    it('should return true', inject(function() {
      var datatypecheck = mockColumnTypeChecksService.isTimeWithTimezone(20);
      expect(datatypecheck).toEqual(true);
    }));

    it('should return true', inject(function() {
      var datatypecheck = mockColumnTypeChecksService.requiresJSONFormatting(12);
      expect(datatypecheck).toEqual(true);
    }));

    it('should return true', inject(function() {
      var datatypecheck = mockColumnTypeChecksService.requiresArrayFormatting([1, 1, 1]);
      expect(datatypecheck).toEqual(true);
    }));

    it('should return true', inject(function() {
      var datatypecheck = mockColumnTypeChecksService.requiresNoFormatting(4);
      expect(datatypecheck).toEqual(true);
    }));

    it('should return false', inject(function() {
      var datatypecheck = mockColumnTypeChecksService.requiresNoFormatting(13);
      expect(datatypecheck).toEqual(false);
    }));

    it('should return false', inject(function() {
      var datatypecheck = mockColumnTypeChecksService.requiresNoFormatting([1, 1, 1]);
      expect(datatypecheck).toEqual(false);
    }));
  });

});
