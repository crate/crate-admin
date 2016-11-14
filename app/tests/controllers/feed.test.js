describe('Feed', function() {
  'use strict';

  var QueryStringAppender;

  beforeEach(module('crate'));
  beforeEach(function() {
    angular.mock.inject(function($injector) {
      QueryStringAppender = $injector.get('QueryStringAppender');
    });
  });

  describe('QueryStringAppender', function() {
    var url = 'https://crate.io/';
    it('should append ?', inject(function() {
      url = QueryStringAppender.append(url, 'foo', 'bar');
      expect(url).toEqual('https://crate.io/?foo=bar');
    }));
    it('should append &', inject(function() {
      url = QueryStringAppender.append(url, 'bar', 'baz');
      expect(url).toEqual('https://crate.io/?foo=bar&bar=baz');
    }));
  });

});
