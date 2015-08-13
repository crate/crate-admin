'use strict';

angular.module('clustercheck', [])
  .factory('ClusterCheck', ['SQLQuery', 'queryResultToObjects', '$q',
    function (SQLQuery, queryResultToObjects, $q) {
      var self = {
        deferred: $q.defer()
      };

      var stmt = 'SELECT id, severity, description, passed FROM sys.checks WHERE passed = false ORDER BY severity DESC, id';

      self.executeStmt = function() {
        var deferred = $q.defer(),
            promise = deferred.promise;

        SQLQuery.execute(stmt)
          .success(function(query) {
            var result = queryResultToObjects(query,
                ['id', 'severity', 'description', 'passed']);
            deferred.resolve(result);
          })
          .error(function() {
            deferred.reject();
          });

        return promise;
      };

      return self;
    }
  ]);
