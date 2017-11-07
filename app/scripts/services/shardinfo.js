'use strict';

angular.module('shardinfo', ['sql'])
  .factory('ShardInfo', function(SQLQuery, queryResultToObjects, $q) {
      var shardInfo = {
        deferred: $q.defer()
      };

      // table info statement
      var tableStmt = 'SELECT table_name, table_schema, format(\'%s.%s\', table_schema, table_name) AS fqn, number_of_shards, number_of_replicas, partitioned_by ' +
          'FROM information_schema.tables ' +
          'WHERE table_schema NOT IN (\'information_schema\', \'sys\', \'pg_catalog\')';

      // shard info statement
      var shardStmt = 'SELECT table_name, schema_name, format(\'%s.%s\', schema_name, table_name) AS fqn, _node[\'id\'] AS node_id, state, routing_state, relocating_node, count(*), "primary", sum(num_docs), avg(num_docs), sum(size) ' +
          'FROM sys.shards ' +
          'GROUP BY table_name, schema_name, fqn, node_id, state, routing_state, relocating_node, "primary"';

      // table partitions statement
      var partStmt = 'SELECT table_name, schema_name, format(\'%s.%s\', schema_name, table_name) AS fqn, SUM(number_of_shards) AS num_shards ' +
          'FROM information_schema.table_partitions WHERE closed = false ' +
          'GROUP BY table_name, schema_name, fqn';

      var recoveryStmt = 'SELECT table_name, schema_name, recovery[\'stage\'] AS recovery_stage, AVG(recovery[\'size\'][\'percent\']), COUNT(*) AS count ' +
          'FROM sys.shards ' +
          'GROUP BY table_name, schema_name, recovery_stage';

      shardInfo.executeTableStmt = function() {
        var deferred = $q.defer(),
            promise = deferred.promise;

        SQLQuery.execute(tableStmt, {}, false, false, false, false)
          .success(function (tableQuery) {
            var result = queryResultToObjects(tableQuery,
                ['name', 'table_schema', 'fqn', 'shards_configured', 'replicas_configured', 'partitioned_by']);
            deferred.resolve(result);
          })
          .error(function () {
            deferred.reject();
          });

        return promise;
      };

      shardInfo.executeShardStmt = function() {
        var deferred = $q.defer(),
           promise = deferred.promise;

        SQLQuery.execute(shardStmt, {}, false, false, false, false)
          .success(function (shardQuery) {
            var result = queryResultToObjects(shardQuery,
                ['table_name', 'schema_name', 'fqn', 'node_id', 'state', 'routing_state', 'relocating_node', 'count', 'primary', 'sum_docs', 'avg_docs', 'size']);
            deferred.resolve(result);
          })
          .error(function () {
            deferred.reject();
          });

        return promise;
      };

      shardInfo.executePartStmt = function() {
        var deferred = $q.defer(),
            promise = deferred.promise;

        SQLQuery.execute(partStmt, {}, false, false, false, false)
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

      shardInfo.executeRecoveryStmt = function() {
        var deferred = $q.defer(),
           promise = deferred.promise;

        SQLQuery.execute(recoveryStmt, {}, false, false, false, false)
          .success(function (recoveryQuery) {
            var result = queryResultToObjects(recoveryQuery,
                ['table_name', 'schema_name', 'recovery_stage', 'recovery_percent', 'count']);
            deferred.resolve(result);
          })
          .error(function () {
            deferred.reject();
          });

        return promise;
      };

      return shardInfo;
    }

  );
