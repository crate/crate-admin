'use strict';

angular.module('clustercheck', [])
  .factory('ClusterCheck', ['SQLQuery', 'queryResultToObjects', '$q',
    function(SQLQuery, queryResultToObjects, $q) {

      const cols = ['id', 'severity', 'description', 'passed'];
      const stmt = 'SELECT id, severity, description, passed FROM sys.checks WHERE passed = false ORDER BY severity DESC, id';

      return {
        deferred: $q.defer(),
        executeStmt: () => {
          let deferred = $q.defer();
          let promise = deferred.promise;

          SQLQuery.execute(stmt)
            .success((query) => {
              var result = queryResultToObjects(query, cols);
              deferred.resolve(result);
            })
            .error(deferred.reject);
          return promise;
        }
      };
    }
  ]);
