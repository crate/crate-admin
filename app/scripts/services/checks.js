'use strict';

angular.module('checks', ['sql'])
  .factory('ClusterCheck', function(SQLQuery, queryResultToObjects, $q) {
    var self = {
      deferred: $q.defer()
    };

    var stmt = 'SELECT id, severity, description, passed ' +
      'FROM sys.checks ' +
      'WHERE passed = FALSE ' +
      'ORDER BY severity DESC, id';
    var cols = ['id', 'severity', 'description', 'passed'];

    self.execute = function() {
      var deferred = $q.defer(),
        promise = deferred.promise;

      SQLQuery.execute(stmt)
        .success(function(query) {
          var result = queryResultToObjects(query, cols);
          deferred.resolve(result);
        })
        .error(function() {
          deferred.reject();
        });

      return promise;
    };

    return self;
  })
  .factory('NodeCheck', function(SQLQuery, queryResultToObjects, $q) {
    var self = {
      deferred: $q.defer()
    };

    var stmt = 'SELECT c.id, c.severity, c.description, c.passed, c.node_id, n.name, c.acknowledged ' +
      'FROM sys.node_checks AS c, sys.nodes AS n ' +
      'WHERE c.node_id = n.id ' +
      'AND c.passed = FALSE ' +
      'AND acknowledged = FALSE ' +
      'ORDER BY c.severity DESC, n.name';
    var cols = ['id', 'severity', 'description', 'passed', 'node_id', 'node_name', 'acknowledged'];

    self.execute = function() {
      var deferred = $q.defer(),
        promise = deferred.promise;

      SQLQuery.execute(stmt)
        .success(function(query) {
          var result = queryResultToObjects(query, cols);
          var checks = {};
          result.map(function(check) {
            var id = check.id;
            if (!(id in checks)) {
              check.nodes = [];
              checks[id] = check;
            }
            checks[id].nodes.push({
              name: check.node_name,
              id: check.node_id
            });
          });
          var array = Object.keys(checks)
            .map(function(id) {
              return checks[id];
            });
          deferred.resolve(array);
        })
        .error(function() {
          deferred.reject();
        });

      return promise;
    };

    return self;
  })
  .factory('ChecksService', function($timeout, $q, NodeCheck, ClusterCheck) {
    var data = {
      checks: {},
      success: false,
    };
    var retryCount = 0;
    var fetch = function(force) {
      $q.all([ClusterCheck.execute(), NodeCheck.execute()])
        .then(function(responses) {
          data.checks.cluster_checks = responses[0];
          data.checks.node_checks = responses[1];
          data.success = true;
          retryCount = 0;
          if (force !== true) {
            $timeout(fetch, 60000);
          }
        }).catch(function() {
          data.success = false;
          retryCount++;
          if (force !== true) {
            $timeout(fetch, 500 * retryCount);
          }
        });
    };
    // Initial fetch
    $timeout(fetch, 2000);
    data.refresh = function() {
      fetch(true);
    };
    return data;
  });
