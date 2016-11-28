describe('NodeListInfo', function() {
  'use strict';

  var mockNodeListInfoService;

  beforeEach(module('common'));
  beforeEach(module('crate'));
  beforeEach(module('nodeinfo'));
  beforeEach(function() {
    angular.mock.inject(function($injector) {
      mockNodeListInfoService = $injector.get('NodeListInfo');
    });
  });

  describe('mockNodeListService sortBy', function() {

    it('should return default sort info', inject(function() {
      expect(mockNodeListInfoService.sort.col).toEqual(['health_value', 'name']);
      expect(mockNodeListInfoService.sort.desc).toEqual(false);

    }));

    it('should return sort info : name - health_value', inject(function() {
      mockNodeListInfoService.sortBy('name');

      expect(mockNodeListInfoService.sort.col).toEqual(['name', 'health_value']);
      expect(mockNodeListInfoService.sort.desc).toEqual(false);

    }));

    it('should return sort info : health_value - name', inject(function() {
      mockNodeListInfoService.sortBy('health_value');

      expect(mockNodeListInfoService.sort.col).toEqual(['health_value', 'name']);
      expect(mockNodeListInfoService.sort.desc).toEqual(true);

    }));

  });

  describe('mockNodeListService sortClass', function() {

    it('should return ""', inject(function() {
      expect(mockNodeListInfoService.sortClass()).toEqual('');
    }));

    it('should return fa fa-caret-up', inject(function() {
      mockNodeListInfoService.sortBy('name');
      expect(mockNodeListInfoService.sortClass('name')).toEqual('fa fa-caret-up');
    }));

    it('should return fa fa-caret-down', inject(function() {
      mockNodeListInfoService.sortBy('health_value');
      expect(mockNodeListInfoService.sortClass('health_value')).toEqual('fa fa-caret-down');
    }));

  });

});