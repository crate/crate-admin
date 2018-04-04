'use strict';
import './sql';

const viewinfo = angular.module('viewinfo', ['sql'])
  .factory('ViewInfo', function($q, SQLQuery, queryResultToObjects) {
    var viewInfo = {
      deferred: $q.defer()
    };

    const VIEWS_STMT = 'SELECT table_name AS name, ' +
      '  table_schema AS schema, ' +
      '  format(\'%s.%s\', table_schema, table_name) AS fqn, ' +
      '  view_definition AS stmt ' +
      'FROM information_schema.views ' +
      'WHERE table_schema NOT IN (\'information_schema\', \'sys\', \'pg_catalog\') ' +
      'ORDER BY schema, name';

    const COLS = ['name', 'schema', 'fqn', 'stmt'];

    viewInfo.executeViewStmt = () => {
      var deferred = $q.defer();
      var promise = deferred.promise;

      SQLQuery.execute(VIEWS_STMT, {}, false, false, false, false)
        .then((q) => {
          deferred.resolve(queryResultToObjects(q, COLS));
        }, () => {
          deferred.reject();
        });

      return promise;
    };

    return viewInfo;
  })
  .factory('ViewList', function() {

    var data = {
      'views': []
    };

    var update = (success, views) => {
      if (success && views && views.length) {
        data.views = views;
      } else {
        data.views = [];
      }
      return {
        'success': success,
        'data': data
      };
    };

    var fetch = (views) => {
      if (views && views.length) {
        return update(true, views);
      } else {
        return update(false, []);
      }
    };

    // initialize
    fetch();

    return {
      'data': data,
      'execute': fetch
    };
  });

export default viewinfo;
