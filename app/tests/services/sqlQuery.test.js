describe('SQLQuery', function() {
  'use strict';

  var mockSQLQuery;

  beforeEach(module('common'));
  beforeEach(module('crate'));
  beforeEach(module('sql'));
  beforeEach(function() {
    angular.mock.inject(function($injector) {
      mockSQLQuery = $injector.get('SQLQuery');
    });
  });

  describe('mockSQLQuery', function() {

    it('should return correct object', inject(function() {

      var response = {
        "cols": ["col1", "col2", "col3", "col4", "col5", "col6"],
        "rows": [
          ["test_col1", "test_col2", ["test_col31", "test_col33", "test_col33"], 4, "5", null],
        ],
        "rowcount": 21,
        "duration": 3.140416
      };

      var headers = ["col1", "col2", "col3", "col4", "col5", "col6"];

      var query = new mockSQLQuery("select col1, col2, col3, col4, col5, col6 from test;", response, null);

      expect(query.error).toEqual(null);
      expect(query.stmt).toEqual("select col1, col2, col3, col4, col5, col6 from test;");
      expect(query.cols).toEqual(["col1", "col2", "col3", "col4", "col5", "col6"]);
      expect(query.duration).toEqual(3.140416);
      expect(query.rowCount).toEqual(21);
      expect(query.rows).toEqual([
        ['test_col1', 'test_col2', ['test_col31', 'test_col33', 'test_col33'], 4, '5', null]
      ]);

      var status = query.status();
      expect(status).toEqual('SELECT OK, 21 rows in set (0.003 sec)');

    }));
    
  });

});
