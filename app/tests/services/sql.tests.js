describe('SQL', function() {
  'use strict';

  var baseURI;

  beforeEach(angular.mock.module('sql'));

  beforeEach(function() {
    angular.mock.inject(function($injector) {
      baseURI = $injector.get('baseURI');
    });
  });

  describe('SQL baseURI', function() {
    it('base uri should keep path', inject(function(baseURI) {
      var fakeLocation = {
        "protocol": "http:",
        "host": "example.com",
        "pathname": "/somepath/",
        "search": ""
      };
      spyOn(baseURI, 'getWindowLocation').and.returnValue(fakeLocation);
      expect(baseURI.getURI('/test')).toEqual('http://example.com/somepath/test');
    }));
  });
});