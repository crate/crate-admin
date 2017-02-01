describe('Console', function() {
  'use strict';

  var KeywordObjectCreator;

  beforeEach(module('crate'));
  beforeEach(function() {
    angular.mock.inject(function($injector) {
      KeywordObjectCreator = $injector.get('KeywordObjectCreator');
    });
  });

  describe('KeywordObjectCreator', function() {
    it('should create object from keyword array', inject(function() {
      var keywordArray = ['select', 'from', 'limit'];
      var keywordsObject = KeywordObjectCreator.create(keywordArray);
      expect(keywordsObject).toEqual({'select': true, 'from': true, 'limit': true});
    }));

    it('should remove duplicate keywords from array', inject(function() {
      var keywordArray = ['select', 'SELECT', 'from', 'from', 'liMIt', 'limit'];
      var keywordsObject = KeywordObjectCreator.create(keywordArray);
      expect(keywordsObject).toEqual({'select': true, 'from': true, 'limit': true});
    }));
  });

});
