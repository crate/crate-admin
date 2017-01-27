describe('SQL', function() {
  'use strict';
  var mockTranslation;
  beforeEach(angular.mock.module('crate'));
  beforeEach(angular.mock.module('translation'));

  beforeEach(function() {
    angular.mock.inject(function($injector) {
      mockTranslation = $injector.get('Translation');
    });
  });

  describe('translation', function() {
    it('should interpolate', inject(function() {
      var sentence = "Hello {name}";
      var terms = {name: 'world'};
      expect(mockTranslation.interpolate(sentence, terms)).toEqual('Hello world');
    }));
  });

});