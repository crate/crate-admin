'use strict';

angular.module('tableinfo', ['sql'])
  .factory('TableInfo', function() {
    var ACTIVE_SHARDS = ['STARTED', 'RELOCATING'];
    var isActiveShard = function(shard) {
      return ACTIVE_SHARDS.indexOf(shard.routing_state) > -1;
    };
    return function TableInfo(shards, configured, partitionedBy, recovery) {
      var shards = shards ? angular.copy(shards) : [];
      var partitionedBy = partitionedBy ? angular.copy(partitionedBy) : [];
      var partitioned = partitionedBy.length > 0;
      var numShardsConfigured = configured || 0;
      var recovery = recovery || [];

      var primaryShards = (function() {
        return shards.filter(function(shard, idx) {
          return shard.primary;
        });
      }());

      var numPrimaryShards = (function() {
        return primaryShards.reduce(function(memo, shard, idx) {
          return memo + shard.count;
        }, 0);
      }());

      var startedShards = (function() {
        return shards.filter(function(shard, idx) {
          return isActiveShard(shard);
        });
      }());

      var numStartedShards = (function() {
        return startedShards.reduce(function(memo, shard, idx) {
          return memo + shard.count;
        }, 0);
      }());

      var numActivePrimaryShards = (function() {
        return shards.filter(function(shard, idx) {
          return isActiveShard(shard) && shard.primary === true;
        }).reduce(function(memo, shard, idx) {
          return memo + shard.count;
        }, 0);
      }());

      var shardSize = (function() {
        return primaryShards.reduce(function(memo, shard, idx) {
          return memo + shard.size;
        }, 0);
      }());

      var numRecords = (function() {
        return primaryShards.reduce(function (memo, shard, idx) {
          return memo + shard.sum_docs;
        }, 0);
      }());

      /**
       * numMissingPrimaryShards must not be less than 0
       * however, when primary shards are relocating they exist actually
       * twice (source and target) for the time of the relocation
       * and therefore causing numActivePrimaryShards being greater than
       * numShardsConfigured.
       **/
      var numMissingPrimaryShards = (function() {
        return (partitioned && numStartedShards === 0) ? 0 :
          Math.max(0, numShardsConfigured - numActivePrimaryShards);
      }());

      var numUnassignedShards = (function() {
        return shards.filter(function(shard, idx) {
          return shard.routing_state == 'UNASSIGNED';
        }).reduce(function(memo, shard, idx, arr) {
          return memo + shard.count;
        }, 0);
      }());

      var numReplicatingShards = (function() {
        return shards.filter(function(shard, idx) {
          return shard.routing_state == 'INITIALIZING' && shard.relocating_node === null;
        }).reduce(function(memo, shard, idx, arr) {
          return memo + shard.count;
        }, 0);
      }());

      var numUnderreplicatedShards = (function() {
        return Math.max(0, numUnassignedShards + numReplicatingShards - numMissingPrimaryShards);
      }());

      var avgDocsPerPrimaryShard = (function() {
        return primaryShards.reduce(function(memo, shard, idx, arr) {
          return memo + shard.avg_docs / arr.length;
        }, 0);
      }());

      var numUnderreplicatedRecords = (function(){
        return Math.ceil(avgDocsPerPrimaryShard * numUnassignedShards);
      }());

      var numRecordsWithReplicas = (function() {
        var numShards = shards.reduce(function(memo, shard, idx) {
          return memo + shard.count;
        }, 0);
        return Math.ceil(avgDocsPerPrimaryShard * numShards);
      }());

      var numUnavailableRecords = (function() {
        var avgDocsPerStartedShard = startedShards.reduce(function(memo, shard, idx, arr){
          return memo + shard.avg_docs / arr.length;
        }, 0);
        return Math.ceil(avgDocsPerStartedShard * numMissingPrimaryShards);
      }());

      var health = (function() {
        if (partitioned && numStartedShards === 0) return 'good';
        if (numPrimaryShards === 0) return 'critical';
        if (numMissingPrimaryShards > 0) return 'critical';
        if (numUnassignedShards > 0 || numUnderreplicatedShards > 0) return 'warning';
        return 'good';
      }());

      var recovery_percent = (shards.length === 0 || recovery.length === 0) ? 100.0 : (function() {
        // stage == 'DONE' -> recovery finished
        var done = recovery.filter(function(data, idx){
          return data.recovery_stage && data.recovery_stage === 'DONE';
        }).reduce(function(memo, data, idx, arr){
          return [
            memo[0] + 100.0 * data.count,
            memo[1] + data.count
          ];
        }, [0, 0]);
        // stage != 'DONE' -> recovery in progress
        var progress = recovery.filter(function(data, idx){
          return data.recovery_stage && data.recovery_stage !== 'DONE';
        }).reduce(function(memo, data, idx, arr){
          return [
            memo[0] + data.recovery_percent * data.count,
            memo[1] + data.count
          ];
        }, [0, 0]);
        // recovery == NULL -> recovery not started yet
        var unassigned = recovery.filter(function(data, idx){
          return data.recovery_stage === null;
        }).reduce(function(memo, data, idx, arr){
          return [
            0,
            memo[1] + data.count
          ];
        }, [0, 0]);
        var percent = (done[0] + progress[0] + unassigned[0]) / (done[1] + progress[1] + unassigned[1]);
        return percent;
      }());

      this.asObject = function asObject() {
        return {
          'shards_configured': numShardsConfigured,
          'health': health,
          'shards_started': numStartedShards,
          'shards_missing': numMissingPrimaryShards,
          'shards_underreplicated': numUnderreplicatedShards,
          'records_total': numRecords,
          'records_total_with_replicas': numRecordsWithReplicas,
          'records_unavailable': numUnavailableRecords,
          'records_underreplicated': numUnderreplicatedRecords,
          'size': shardSize,
          'partitioned': partitioned,
          'partitioned_by': partitionedBy,
          'recovery_percent': recovery_percent
        };
      };

    };
  })
  .factory('TableList', function($timeout, $q, TableInfo, SQLQuery, roundWithUnitFilter, bytesFilter, ShardInfo) {

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
      'good': 'label-success',
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

    var update = function update(success, tables, shards, partitions, recovery) {
      var _tables = tables || [];
      var _shards = shards || [];
      var _partitions = partitions || [];
      var _recovery = recovery || [];
      // table info query was successful
      if (success && _tables.length) {
        for (var i=0; i<_tables.length; i++) {
          var table = _tables[i];
          var shardsForTable = _shards.filter(function(item, idx) {
            return item.table_name === table.name && item.table_schema == table.table_schema;
          });
          var partitionsForTable = _partitions.filter(function(item, idx) {
            return item.table_name === table.name && item.table_schema == table.table_schema;
          });
          var recoveryForTable = _recovery.filter(function(item, idx) {
            return item.table_name === table.name && item.table_schema == table.table_schema;
          });
          if (table.partitioned_by && partitionsForTable.length === 1) {
            table.shards_configured = partitionsForTable[0].num_shards;
          }
          var tableInfo = new TableInfo(shardsForTable, table.shards_configured, table.partitioned_by, recoveryForTable);
          var info = tableInfo.asObject();

          // extend table object with information from TableInfo instance
          $.extend(table, info);
          table.health_label_class = colorMapLabel[table.health];
          table.health_panel_class = colorMapPanel[table.health];
          table.type_display_name = table.table_schema == "blob" ?  "TABLE.BLOBS" : "TABLE.RECORDS";

          // create summary
          var summary = table.shards_configured + ' Shards';
          summary += ' / ' + table.replicas_configured + ' Replicas';
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

      ShardInfo.deferred.promise.then(function(result) {
        update(true, result.tables, result.shards, result.partitions, result.recovery);
      }).catch(function(result) {
        if (jQuery.isEmptyObject(result)) return;
        if (result.tables && result.shards && result.recovery) {
          update(true, result.tables, result.shards, null, result.recovery);
        } else if (result.tables) {
          update(true, result.tables);
        } else {
          update(false);
        }
      }).finally(function() {
        ShardInfo.deferred.promise = $q.defer().promise;
        fetch();
      });
    };

    // initialize
    fetch();

    return {
      'data': data,
      'execute': function() { return deferred.promise; }
    };

  });
