'use strict';

angular.module('shardinfo', [])
  .factory('ShardInfo', ['SQLQuery', 'queryResultToObjects', '$q',
    function(SQLQuery, queryResultToObjects, $q) {

      // table info statement
      const tableStmt = "SELECT table_name, schema_name, format('%s.%s', schema_name, table_name) as fqn, number_of_shards, number_of_replicas, partitioned_by " +
          "FROM information_schema.tables " +
          "WHERE schema_name not in ('information_schema', 'sys')";
      const tableStmtColumns = ['name', 'schema_name', 'fqn', 'shards_configured', 'replicas_configured', 'partitioned_by'];

      // shard info statement
      const shardStmt = "SELECT table_name, schema_name, format('%s.%s', schema_name, table_name) AS fqn, _node['id'] AS node_id, state, routing_state, relocating_node, count(*), \"primary\", sum(num_docs), avg(num_docs), sum(size) " +
          "FROM sys.shards " +
          "GROUP BY table_name, schema_name, fqn, node_id, state, routing_state, relocating_node, \"primary\"";
      const shardStmtColumns = ['table_name', 'schema_name', 'fqn', 'node_id', 'state', 'routing_state', 'relocating_node', 'count', 'primary', 'sum_docs', 'avg_docs', 'size'];

      // table partitions statement
      const partStmt = "SELECT table_name, schema_name, format('%s.%s', schema_name, table_name) as fqn, sum(number_of_shards) as num_shards " +
          "FROM information_schema.table_partitions " +
          "GROUP BY table_name, schema_name, fqn";
      const partStmtColumns = ['table_name', 'schema_name', 'fqn', 'num_shards'];

      // recovery info statement
      const recoveryStmt = "SELECT table_name, schema_name, recovery['stage'] AS recovery_stage, avg(recovery['size']['percent']), count(*) as count " +
          "FROM sys.shards " +
          "GROUP BY table_name, schema_name, recovery_stage";
      const recoveryStmtColumns = ['table_name', 'schema_name', 'recovery_stage', 'recovery_percent', 'count'];

      var shardinfo = {
        deferred: $q.defer()
      };

      shardInfo.executeTableStmt = () => {
        let deferred = $q.defer();
        let promise = deferred.promise;

        SQLQuery.execute(tableStmt)
          .success((tableQuery) => {
            let result = queryResultToObjects(tableQuery, tableStmtColumns);
            deferred.resolve(result);
          })
          .error(deferred.reject);

        return promise;
      };

      shardInfo.executeShardStmt = () => {
        let deferred = $q.defer();
        let promise = deferred.promise;

        SQLQuery.execute(shardStmt)
          .success((shardQuery) => {
            let result = queryResultToObjects(shardQuery, shardStmtColumns);
            deferred.resolve(result);
          })
          .error(deferred.reject);

        return promise;
      };

      shardInfo.executePartStmt = () => {
        let deferred = $q.defer();
        let promise = deferred.promise;

        SQLQuery.execute(partStmt)
          .success((partQuery) => {
            let result = queryResultToObjects(partQuery, partStmtColumns);
            deferred.resolve(result);
          })
          .error(deferred.reject);

        return promise;
      };

      shardInfo.executeRecoveryStmt = () => {
        let deferred = $q.defer();
        let promise = deferred.promise;

        SQLQuery.execute(recoveryStmt)
          .success((recoveryQuery) => {
            let result = queryResultToObjects(recoveryQuery, recoveryStmtColumns);
            deferred.resolve(result);
          })
          .error(deferred.reject);

        return promise;
      };

      return shardInfo;
    }

  ]);
