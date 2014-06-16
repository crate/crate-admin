'use strict';

angular.module('tableinfo', ['sql'])
  .factory('TableInfo', function() {
    return function TableInfo(shards, numConfigured, partitionedBy) {
      this.partitionedBy = partitionedBy || [];
      this.partitioned = this.partitionedBy.length > 0;
      this.shards = shards;
      this.shards_configured = numConfigured || 0;
      this.primaryShards = function primaryShards() {
        return this.shards.filter(function (shard, idx) {
          return shard.primary;
        });
      };
      this.size = function size() {
        var primary = this.primaryShards();
        return primary.reduce(function(memo, shard, idx) {
          return memo + shard.size;
        }, 0);
      };
      this.totalRecords = function totalRecords() {
        var primary = this.primaryShards();
        return primary.reduce(function (memo, shard, idx) {
          return memo + shard.sum_docs;
        }, 0);
      };
      this.missingShards = function missingShards() {
          if (this.partitioned && this.startedShards() === 0) return 0;
          var activePrimaryShards = this.shards.filter(function(shard) {
              return shard.state in {'STARTED':'', 'RELOCATING':''} && shard.primary === true;
          });
          var numActivePrimaryShards = activePrimaryShards.reduce(function(memo, shard, idx) {
            return shard.count + memo;
          }, 0);
          return Math.max(this.shards_configured-numActivePrimaryShards, 0);
      };
      this.underreplicatedShards = function underreplicatedShards() {
        return this.shards.filter(function(obj, idx){
          return (obj.state != 'STARTED' || obj.state != 'RELOCATING') && obj.primary === false;
        }).reduce(function(memo, obj, idx){
          return obj.count + memo;
        }, 0);
      };
      this.unassignedShards = function unassignedShards() {
          var shards = this.shards.filter(function(shard, idx) {
              return shard.state == 'UNASSIGNED';
          });
          return shards.reduce(function(memo, shard, idx) { return shard.count + memo; }, 0);
      };
      this.startedShards = function startedShards() {
          var shards = this.shards.filter(function(shard, idx) {
              return shard.state == 'STARTED';
          });
          return shards.reduce(function(memo, shard, idx) {return shard.count + memo; }, 0);
      };
      this.underreplicatedRecords = function underreplicatedRecords() {
          var primary = this.primaryShards();
          return primary.length ? Math.ceil(primary[0].avg_docs * this.underreplicatedShards()) : 0;
      };
      this.unavailableRecords = function unavailableRecords() {
          var started = this.shards.filter(function(shard, idx) {
              return shard.state == 'STARTED';
          });
          return started.length ? Math.ceil(started[0].avg_docs * this.missingShards()) : 0;
      };
      this.health = function health() {
          if (this.partitioned && this.startedShards() === 0) return 'good';
          if (this.primaryShards().length === 0) return 'critical';
          if (this.missingShards() > 0) return 'critical';
          if (this.unassignedShards() > 0) return 'warning';
          return 'good';
      };
      this.asObject = function asObject() {
        var o = {};
        o.shards_configured = this.shards_configured;
        o.health = this.health();
        o.shards_started = this.startedShards();
        o.shards_missing = this.missingShards();
        o.shards_underreplicated = this.underreplicatedShards();
        o.records_total = this.totalRecords();
        o.records_unavailable = this.unavailableRecords();
        o.records_underreplicated = this.underreplicatedRecords();
        o.size = this.size();
        o.partitioned = this.partitioned;
        o.partitioned_by = this.partitionedBy;
        return o;
      };
    };
  })
  .factory('TableList', function($timeout, $q, TableInfo, SQLQuery, roundWithUnitFilter, bytesFilter, queryResultToObjects){

    var deferred = $q.defer();
    var data = {
      'tables': []
    };
    var timeout = null;
    var refreshInterval = 5000;

    var healthPriorityMap = {
      'good': 2,
      'warning': 1,
      'critical': 0,
      '--': 0
    };

    var colorMapLabel = {
      'good': '',
      'warning': 'label-warning',
      'critical': 'label-danger',
      '--': ''
    };

    var colorMapPanel = {
      'good': 'panel-success',
      'warning': 'panel-warning',
      'critical': 'panel-danger',
      '--': 'panel-default'
    };

    var sortByHealth = function sortByHealth(a,b) {
      if (healthPriorityMap[a.health] < healthPriorityMap[b.health]) return -1;
      if (healthPriorityMap[a.health] > healthPriorityMap[b.health]) return 1;
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    };

    var update = function update(success, tables, shards) {
      var _tables = tables || [];
      var _shards = shards || [];
      // table info query was successful
      if (success && _tables.length) {
        for (var i=0; i<_tables.length; i++) {
          var table = _tables[i];
          var shardsForTable = _shards.filter(function(shard, idx) {
            return shard.table_name === table.name;
          });
          var tableInfo = new TableInfo(shardsForTable, table.shards_configured, table.partitioned_by);
          var info = tableInfo.asObject();

          // extend table object with information from TableInfo instance
          $.extend(table, info);
          table.health_label_class = colorMapLabel[table.health];
          table.health_panel_class = colorMapPanel[table.health];
          table.type_display_name = table.schema_name == "doc" ? "Record" : "Blob";

          // create summary
          var summary = roundWithUnitFilter(table.records_total, 1) + ' Records (' + bytesFilter(table.size) + ') / ' +
                table.replicas_configured + ' Replicas / ' + table.shards_configured + ' Shards (' + table.shards_started + ' Started)';
          if (table.records_unavailable) {
            summary = roundWithUnitFilter(table.records_unavailable, 1) + ' Unavailable Records / ' + summary;
          } else if (table.shards_underreplicated) {
            summary = table.shards_underreplicated + ' Underreplicated Shards / ' + summary;
          }
          if (table.records_underreplicated) {
            summary = table.records_underreplicated + ' Underreplicated Records / ' + summary;
          }
          table.summary = summary;
        };

        // sort tables by health and name
        data.tables = _tables.sort(sortByHealth);
      } else {
        data.tables = [];
      }

      deferred.notify({'success': success, 'data': data});
      timeout = $timeout(fetch, refreshInterval);
    };

    var fetch = function fetch() {
      $timeout.cancel(timeout);

      // table info statement
      var tableStmt = 'select table_name, number_of_shards, number_of_replicas, schema_name, partitioned_by ' +
          'from information_schema.tables ' +
          'where schema_name in (\'doc\', \'blob\')';

      // shard info statement
      var shardStmt = 'select table_name, schema_name, sum(num_docs), "primary", avg(num_docs), count(*), state, sum(size) ' +
          'from sys.shards ' +
          'group by table_name, schema_name, "primary", state ' +
          'order by table_name, "primary", state';

      SQLQuery.execute(tableStmt).success(function(tableQuery){
        var tables = queryResultToObjects(tableQuery,
            ['name', 'shards_configured', 'replicas_configured', 'schema_name', 'partitioned_by']);
        SQLQuery.execute(shardStmt).success(function(shardQuery) {
          var shards = queryResultToObjects(shardQuery,
              ['table_name', 'schema_name', 'sum_docs', 'primary', 'avg_docs', 'count', 'state', 'size']);
          update(true, tables, shards);
        }).error(function(sqlQuery) {
          update(true, tables);
        });

      }).error(function(sqlQuery) {
        update(false);
      });

    };

    // initialize
    fetch();

    return {
      'data': data,
      'promise': deferred.promise
    };

  });
