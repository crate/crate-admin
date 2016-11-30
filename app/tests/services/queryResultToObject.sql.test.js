describe('queryResultToObjects', function() {
  'use strict';

  var mockQueryResultToObjectsService;

  beforeEach(module('common'));
  beforeEach(module('crate'));
  beforeEach(module('sql'));
  beforeEach(function() {
    angular.mock.inject(function($injector) {
      mockQueryResultToObjectsService = $injector.get('queryResultToObjects');
    });
  });

  describe('mockQueryResultToObjectsService', function() {

    it('should return correct object', inject(function() {

      var queryResult = {
        "cols": ["col1", "col2", "col3", "col4", "col5", "col6"],
        "rows": [
          ["test_col1", "test_col2", ["test_col31", "test_col33", "test_col33"], 4, "5", null],
        ],
        "rowcount": 21,
        "duration": 3.140416
      };

      var headers = ["col1", "col2", "col3", "col4", "col5", "col6"];

      var obj = mockQueryResultToObjectsService(queryResult, headers);

      expect(obj).toEqual([{
        col1: 'test_col1',
        col2: 'test_col2',
        col3: ['test_col31', 'test_col33', 'test_col33'],
        col4: 4,
        col5: '5',
        col6: null
      }]);

    }));

    it('should return empty list', inject(function() {

      var queryResult = {
        "cols": ["col1", "col2", "col3", "col4", "col5", "col6"],
        "rows": [],
        "rowcount": 0,
        "duration": 0
      };

      var headers = ["col1", "col2", "col3", "col4", "col5", "col6"];

      var obj = mockQueryResultToObjectsService(queryResult, headers);

      expect(obj).toEqual([]);

    }));


    it('should return empty list', inject(function() {

      var queryResult = {
      };

      var headers = ["col1", "col2", "col3", "col4", "col5", "col6"];

      var obj = mockQueryResultToObjectsService(queryResult, headers);

      expect(obj).toEqual([]);

    }));

  });

});