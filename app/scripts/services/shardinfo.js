'use strict';

angular.module('shardinfo', [])
  .factory('ShardInfo', ['SQLQuery', 'queryResultToObjects',
    function (SQLQuery, queryResultToObjects) {
      var self = {
        tables: {},
        shards: {},
        partitions: {}
      };

      // table info statement
      var tableStmt = 'select table_name, number_of_shards, number_of_replicas, schema_name, partitioned_by ' +
          'from information_schema.tables ' +
          'where schema_name not in (\'information_schema\', \'sys\')';

      // shard info statement
      var shardStmt = 'select table_name, schema_name, sum(num_docs), "primary", avg(num_docs), count(*), state, sum(size) ' +
          'from sys.shards ' +
          'group by table_name, schema_name, "primary", state ' +
          'order by table_name, "primary", state';

      // table partitions statement
      var partStmt = 'select table_name, schema_name, sum(number_of_shards) as num_shards ' +
          'from information_schema.table_partitions ' +
          'group by table_name, schema_name';

      self.executeTableStmt = function () {
        return SQLQuery.execute(tableStmt).success(function (tableQuery) {
          self.tables = queryResultToObjects(tableQuery,
              ['name', 'shards_configured', 'replicas_configured', 'schema_name', 'partitioned_by']);
        });
      };

      self.executeShardStmt = function () {
        return SQLQuery.execute(shardStmt).success(function (shardQuery) {
          self.shards = queryResultToObjects(shardQuery,
              ['table_name', 'schema_name', 'sum_docs', 'primary', 'avg_docs', 'count', 'state', 'size']);
        });
      };

      self.executePartStmt = function () {
        return SQLQuery.execute(partStmt).success(function (partQuery) {
          self.partitions = queryResultToObjects(partQuery,
              ['table_name', 'schema_name', 'num_shards']);
        });
      };

      return self;
    }

  ]);
