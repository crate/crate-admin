describe('common', function() {
  'use strict';

  var parseIsoDatetime;


  beforeEach(module('common'));
  beforeEach(module('crate'));
  beforeEach(module('sql'));

  beforeEach(function() {
    angular.mock.inject(function($injector) {
      parseIsoDatetime = $injector.get('parseIsoDatetime');
    });
  });

  describe('parseIsoDatetime', function() {
    it('parseIsoDatetime should parse isodate', inject(function(parseIsoDatetime) {
      var date = '2015-02-26T16:27:15+0000' ;
      expect(parseIsoDatetime(date).toDateString()).toEqual('Thu Feb 26 2015');
    }));
  });
});