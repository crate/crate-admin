'use strict';
import './sql';

const udfinfo = angular.module('udfinfo', ['sql'])
  .factory('UdfInfo', function($q, SQLQuery, queryResultToObjects) {
    var udfInfo = {
      deferred: $q.defer()
    };

    const UDFS_STMT = `SELECT
    routine_name as "name",
    routine_schema AS "schema",
    format('%s.%s', routine_name, routine_schema) AS "fqn",
    routine_definition AS "definition",
    (regexp_replace(specific_name, '.*\\((.*)\\)', '$1')) as "input_types",
    (data_type) AS "return_type",
    routine_body AS "language"
FROM information_schema.routines
where routine_type = 'FUNCTION';
`

    const COLS = ['name', 'schema', 'fqn', 'definition', 'input_types', 'return_type', 'language'];

    udfInfo.executeUdfStmt = () => {
      var deferred = $q.defer();
      var promise = deferred.promise;

      SQLQuery.execute(UDFS_STMT, {}, false, false, false, false)
        .then((q) => {
          deferred.resolve(queryResultToObjects(q, COLS));
        }, () => {
          deferred.reject();
        });

      return promise;
    };

    return udfInfo;
  })
  .factory('UdfList', function() {

    var data = {
      'udfs': []
    };

    var update = (success, udfs) => {
      if (success && udfs && udfs.length) {
        data.udfs = udfs;
      } else {
        data.udfs = [];
      }
      return {
        'success': success,
        'data': data
      };
    };

    var fetch = (udfs) => {
      if (udfs && udfs.length) {
        return update(true, udfs);
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

export default udfinfo;
