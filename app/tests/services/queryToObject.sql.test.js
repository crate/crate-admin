describe('queryResultToObjects', function() {
  'use strict';

  var mockQueryResultToObjectsService;

  beforeEach(angular.mock.module('common'));
  beforeEach(angular.mock.module('crate'));
  beforeEach(angular.mock.module('sql'));
  beforeEach(function() {
    angular.mock.inject(function($injector) {
      mockQueryResultToObjectsService = $injector.get('queryResultToObjects');
    });
  });

  describe('mockQueryResultToObjectsService', function() {

    it('should return correct object', inject(function(SQLQuery) {

      var response = {
        "cols": ["col1", "col2", "col3", "col4", "col5", "col6"],
        "rows": [
          ["test_col1", "test_col2", ["test_col31", "test_col33", "test_col33"], 4, "5", null],
        ],
        "rowcount": 21,
        "duration": 3.140416
      };

      var headers = ["col1", "col2", "col3", "col4", "col5", "col6"];

      var query = new SQLQuery("select col1, col2, col3, col4, col5, col6 from test;", response, null);

      var obj = mockQueryResultToObjectsService(query, headers);

      expect(obj).toEqual([Object({
        col1: 'test_col1',
        col2: 'test_col2',
        col3: ['test_col31', 'test_col33', 'test_col33'],
        col4: 4,
        col5: '5',
        col6: null
      })]);

    }));
  });

});
