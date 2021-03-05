describe('Feed', function() {
  'use strict';

  var QueryStringAppender;

  beforeEach(angular.mock.module('crate'));
  beforeEach(function() {
    angular.mock.inject(function($injector) {
      QueryStringAppender = $injector.get('QueryStringAppender');
    });
  });

  describe('QueryStringAppender', function() {
    it('should append ?', inject(function() {
      var url = 'https://crate.io/';
      url = QueryStringAppender.append(url, 'foo', 'bar');
      expect(url).toEqual('https://crate.io/?foo=bar');
    }));
    it('should append &', inject(function() {
      var url = 'https://crate.io/';
      url = QueryStringAppender.append(url, 'foo', 'bar');
      url = QueryStringAppender.append(url, 'bar', 'baz');
      expect(url).toEqual('https://crate.io/?foo=bar&bar=baz');
    }));
  });

});
