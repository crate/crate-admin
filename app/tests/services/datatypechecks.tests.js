describe('ColumnTypeCheck', function() {
  'use strict';

  var mockColumnTypeChecksService;

  beforeEach(module('common'));
  beforeEach(module('crate'));
  beforeEach(module('datatypechecks'));
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
      var datatypecheck = mockColumnTypeChecksService.requiresJSONFormatting(12);
      expect(datatypecheck).toEqual(true);
    }));

    it('should return true', inject(function() {
      var datatypecheck = mockColumnTypeChecksService.requiresArrayFormatting([1,1,1]);
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
      var datatypecheck = mockColumnTypeChecksService.requiresNoFormatting([1,1,1]);
      expect(datatypecheck).toEqual(false);
    }));
  });

});

describe('ColumnTypeCheck', function() {
  'use strict';

  var mockObjectTypeChecksService;

  beforeEach(module('common'));
  beforeEach(module('crate'));
  beforeEach(module('datatypechecks'));
  beforeEach(function() {
    angular.mock.inject(function($injector) {
      mockObjectTypeChecksService = $injector.get('ObjectTypeCheck');
    });
  });

  describe('mockObjectTypeChecksService', function() {

    it('should return true', inject(function() {
      var objecttypecheck = mockObjectTypeChecksService.isArray([1,1,1]);
      expect(objecttypecheck).toEqual(true);
    }));

    it('should return true', inject(function() {
      var objecttypecheck = mockObjectTypeChecksService.isObject({name: 'A really nice object'});
      expect(objecttypecheck).toEqual(true);
    }));

    it('should return true', inject(function() {
      var objecttypecheck = mockObjectTypeChecksService.isValue('Hello world!');
      expect(objecttypecheck).toEqual(true);
    }));

    it('should return boolean', inject(function() {
      var objecttypecheck = mockObjectTypeChecksService.getType(true);
      expect(objecttypecheck).toEqual('boolean');
    }));

    it('should return string', inject(function() {
      var objecttypecheck = mockObjectTypeChecksService.getType('Hello world!');
      expect(objecttypecheck).toEqual('string');
    }));

    it('should return number', inject(function() {
      var objecttypecheck = mockObjectTypeChecksService.getType(3.14159);
      expect(objecttypecheck).toEqual('number');
    }));
  });

});
