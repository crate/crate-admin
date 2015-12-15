'use strict';

angular.module('shardinfo', [])
  .factory('ShardInfo', ['SQLQuery', 'queryResultToObjects', '$q',
    function (SQLQuery, queryResultToObjects, $q) {
      var shardInfo = {
        deferred: $q.defer()
      };

      // table info statement
      var tableStmt = 'select table_name, schema_name, format(\'%s.%s\', schema_name, table_name) as fqn, number_of_shards, number_of_replicas, partitioned_by ' +
          'from information_schema.tables ' +
          'where schema_name not in (\'information_schema\', \'sys\')';

      // shard info statement
      var shardStmt = 'select table_name, schema_name, format(\'%s.%s\', schema_name, table_name) as fqn, _node[\'id\'] as node_id, state, count(*), "primary", sum(num_docs), avg(num_docs), sum(size) ' +
          'from sys.shards ' +
          'group by table_name, schema_name, fqn, node_id, state, "primary"';

      // table partitions statement
      var partStmt = 'select table_name, schema_name, format(\'%s.%s\', schema_name, table_name) as fqn, sum(number_of_shards) as num_shards ' +
          'from information_schema.table_partitions ' +
          'group by table_name, schema_name, fqn';
      
      var recoveryStmt = 'select table_name, schema_name, recovery[\'stage\'] as recovery_stage, recovery[\'size\'][\'percent\'] as recovery_percent ' +
          'from sys.shards ' +
          'group by table_name, schema_name, recovery_stage, recovery_percent';

      shardInfo.executeTableStmt = function () {
        var deferred = $q.defer(),
            promise = deferred.promise;

        SQLQuery.execute(tableStmt)
          .success(function (tableQuery) {
            var result = queryResultToObjects(tableQuery,
                ['name', 'schema_name', 'fqn', 'shards_configured', 'replicas_configured', 'partitioned_by']);
            deferred.resolve(result);
          })
          .error(function () {
            deferred.reject();
          });

        return promise;
      };

      shardInfo.executeShardStmt = function () {
        var deferred = $q.defer(),
           promise = deferred.promise;

        SQLQuery.execute(shardStmt)
          .success(function (shardQuery) {
            var result = queryResultToObjects(shardQuery,
                ['table_name', 'schema_name', 'fqn', 'node_id', 'state', 'count', 'primary', 'sum_docs', 'avg_docs', 'size']);
            deferred.resolve(result);
          })
          .error(function () {
            deferred.reject();
          });

        return promise;
      };

      shardInfo.executePartStmt = function () {
        var deferred = $q.defer(),
            promise = deferred.promise;

        SQLQuery.execute(partStmt)
          .success(function (partQuery) {
            var result = queryResultToObjects(partQuery,
                ['table_name', 'schema_name', 'fqn', 'num_shards']);
            deferred.resolve(result);
          })
          .error(function () {
            deferred.reject();
          });

        return promise;
      };

      shardInfo.executeRecoveryStmt = function () {
        var deferred = $q.defer(),
           promise = deferred.promise;

        SQLQuery.execute(recoveryStmt)
          .success(function (recoveryQuery) {
            var result = queryResultToObjects(recoveryQuery,
                ['table_name', 'schema_name', 'recovery_stage', 'recovery_percent']);
            deferred.resolve(result);
          })
          .error(function () {
            deferred.reject();
          });

        return promise;
      };

      return shardInfo;
    }

  ]);
