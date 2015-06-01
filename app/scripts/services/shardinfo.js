'use strict';

angular.module('shardinfo', [])
  .factory('ShardInfo', ['SQLQuery', 'queryResultToObjects', '$q',
    function (SQLQuery, queryResultToObjects, $q) {
      var self = {
        deferred: $q.defer()
      };

      // table info statement
      var tableStmt = 'select table_name, number_of_shards, number_of_replicas, schema_name, partitioned_by ' +
          'from information_schema.tables ' +
          'where schema_name not in (\'information_schema\', \'sys\')';

      // shard info statement
        var shardStmt = 'select table_name, schema_name, _node[\'id\'] as node_id, state, count(*), "primary", sum(num_docs), avg(num_docs), sum(size) ' +
        'from sys.shards ' +
        'group by table_name, schema_name, node_id, state, "primary"';

      // table partitions statement
      var partStmt = 'select table_name, schema_name, sum(number_of_shards) as num_shards ' +
          'from information_schema.table_partitions ' +
          'group by table_name, schema_name';

      self.executeTableStmt = function () {
        var deferred = $q.defer(),
            promise = deferred.promise;

        SQLQuery.execute(tableStmt)
          .success(function (tableQuery) {
            var result = queryResultToObjects(tableQuery,
                ['name', 'shards_configured', 'replicas_configured', 'schema_name', 'partitioned_by']);
            deferred.resolve(result);
          })
          .error(function () {
            deferred.reject();
          });

        return promise;
      };

      self.executeShardStmt = function () {
        var deferred = $q.defer(),
           promise = deferred.promise;

        SQLQuery.execute(shardStmt)
          .success(function (shardQuery) {
            var result = queryResultToObjects(shardQuery,
                ['table_name', 'schema_name', 'node_id', 'state', 'count', 'primary', 'sum_docs', 'avg_docs', 'size']);
            deferred.resolve(result);
          })
          .error(function () {
            deferred.reject();
          });

        return promise;
      };

      self.executePartStmt = function () {
        var deferred = $q.defer(),
            promise = deferred.promise;

        SQLQuery.execute(partStmt)
          .success(function (partQuery) {
            var result = queryResultToObjects(partQuery,
                ['table_name', 'schema_name', 'num_shards']);
            deferred.resolve(result);
          })
          .error(function () {
            deferred.reject();
          });

        return promise;
      };

      return self;
    }

  ]);
