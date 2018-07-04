describe('common', function() {
  'use strict';

  var parseIsoDatetime;


  beforeEach(angular.mock.module('common'));
  beforeEach(angular.mock.module('crate'));
  beforeEach(angular.mock.module('sql'));

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
