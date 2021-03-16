'use strict';
import './sql';

const tableinfo = angular.module('tableinfo', ['sql'])
  .factory('TableInfo', function() {
    var ACTIVE_SHARDS = ['STARTED', 'RELOCATING'];
    var isActiveShard = function(shard) {
      return ACTIVE_SHARDS.indexOf(shard.routing_state) > -1;
    };

    var dotNotationToSubscript = function (column) {
      return column.replace(/\.([a-zA-Z]+)/g, function(match, p1, offset, str) {
        return `['` + p1 + `']`; 
      });
    };

    return function(arg1, arg2, arg3, arg4) {
      var shards = arg1 ? angular.copy(arg1) : [];
      var partitionedBy = arg3 ? angular.copy(arg3).map(dotNotationToSubscript) : [];
      var partitioned = partitionedBy.length > 0;
      var numShardsConfigured = arg2 || 0;
      var recovery = arg4 || [];

      var primaryShards = (function() {
        return shards.filter(function(shard) {
          return shard.primary;
        });
      }());

      var numPrimaryShards = (function() {
        return primaryShards.reduce(function(memo, shard) {
          return memo + shard.count;
        }, 0);
      }());

      var startedShards = (function() {
        return shards.filter(function(shard) {
          return isActiveShard(shard);
        });
      }());

      var numStartedShards = (function() {
        return startedShards.reduce(function(memo, shard) {
          return memo + shard.count;
        }, 0);
      }());

      var numActivePrimaryShards = (function() {
        return shards.filter(function(shard) {
          return isActiveShard(shard) && shard.primary === true;
        }).reduce(function(memo, shard) {
          return memo + shard.count;
        }, 0);
      }());

      var shardSize = (function() {
        return primaryShards.reduce(function(memo, shard) {
          return memo + shard.size;
        }, 0);
      }());

      var numRecords = (function() {
        return primaryShards.reduce(function(memo, shard) {
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
        return shards.filter(function(shard) {
          return shard.routing_state == 'UNASSIGNED';
        }).reduce(function(memo, shard) {
          return memo + shard.count;
        }, 0);
      }());

      var numReplicatingShards = (function() {
        return shards.filter(function(shard) {
          return shard.routing_state == 'INITIALIZING' && shard.relocating_node === null;
        }).reduce(function(memo, shard) {
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

      var numUnderreplicatedRecords = (function() {
        return Math.ceil(avgDocsPerPrimaryShard * numUnassignedShards);
      }());

      var numRecordsWithReplicas = (function() {
        var numShards = shards.reduce(function(memo, shard) {
          return memo + shard.count;
        }, 0);
        return Math.ceil(avgDocsPerPrimaryShard * numShards);
      }());

      var numUnavailableRecords = (function() {
        var avgDocsPerStartedShard = startedShards.reduce(function(memo, shard, idx, arr) {
          return memo + shard.avg_docs / arr.length;
        }, 0);
        return Math.ceil(avgDocsPerStartedShard * numMissingPrimaryShards);
      }());

      var health = (function() {
        // table health status:
        // good : all shards (primary and replicated) are started
        // warning : all primary shards are started && at least on replicated shard is not started
        // critical : at least one primary shard is not started

        if (!partitioned) {
          if (numPrimaryShards === 0 || numMissingPrimaryShards > 0) {
            return 'critical';
          }
          if (numUnassignedShards > 0 || numUnderreplicatedShards > 0) {
            return 'warning';
          }
        } else {
          //case of newly created table
          if (numStartedShards === 0 && numMissingPrimaryShards === 0 &&
            numUnassignedShards === 0 && numUnderreplicatedShards ===0) {
            return 'good';
          }
          if (numPrimaryShards === 0 || numMissingPrimaryShards > 0) {
            return 'critical';
          }
          if (numUnassignedShards > 0 || numUnderreplicatedShards > 0) {
            return 'warning';
          }
        }
        return 'good';
      }());

      var recovery_percent = (shards.length === 0 || recovery.length === 0) ? 100.0 : (function() {
        // stage == 'DONE' -> recovery finished
        var done = recovery.filter(function(data) {
          return data.recovery_stage && data.recovery_stage === 'DONE';
        }).reduce(function(memo, data) {
          return [
            memo[0] + 100.0 * data.count,
            memo[1] + data.count
          ];
        }, [0, 0]);
        // stage != 'DONE' -> recovery in progress
        var progress = recovery.filter(function(data) {
          return data.recovery_stage && data.recovery_stage !== 'DONE';
        }).reduce(function(memo, data) {
          return [
            memo[0] + data.recovery_percent * data.count,
            memo[1] + data.count
          ];
        }, [0, 0]);
        // recovery == NULL -> recovery not started yet
        var unassigned = recovery.filter(function(data) {
          return data.recovery_stage === null;
        }).reduce(function(memo, data) {
          return [
            0,
            memo[1] + data.count
          ];
        }, [0, 0]);
        var percent = (done[0] + progress[0] + unassigned[0]) / (done[1] + progress[1] + unassigned[1]);
        return percent;
      }());

      this.asObject = function() {
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
  .factory('TableList', function (TableInfo, SQLQuery, roundWithUnitFilter, $filter) {

    var fetch;

    var data = {
      'tables': []
    };

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
      'good': 'cr-panel--success',
      'warning': 'cr-panel--warning',
      'critical': 'cr-panel--danger',
      '--': 'cr--panel-default'
    };

    var sortByHealth = function(a, b) {
      if (healthPriorityMap[a.health] < healthPriorityMap[b.health]) {
        return -1;
      } else if (healthPriorityMap[a.health] > healthPriorityMap[b.health]) {
        return 1;
      } else if (a.name < b.name) {
        return -1;
      } else if (a.name > b.name) {
        return 1;
      }
      return 0;
    };

    var tableFilter = function(table) {
      return function(item) {
        return item.table_name === table.name && item.schema_name == table.table_schema;
      };
    };

    var update = function(success, tables, shards, partitions, recovery) {
      var _tables = tables || [];
      var _shards = shards || [];
      var _partitions = partitions || [];
      var _recovery = recovery || [];
      // table info query was successful
      if (success && _tables.length) {
        for (var i = 0; i < _tables.length; i++) {
          var table = _tables[i];
          var filterBySchemaNameTableName = tableFilter(table);
          var shardsForTable = _shards.filter(filterBySchemaNameTableName);
          var partitionsForTable = _partitions.filter(filterBySchemaNameTableName);
          var recoveryForTable = _recovery.filter(filterBySchemaNameTableName);
          if (table.partitioned_by && partitionsForTable.length === 1) {
            table.shards_configured = partitionsForTable[0].num_shards;
          }
          var tableInfo = new TableInfo(shardsForTable, table.shards_configured, table.partitioned_by, recoveryForTable);
          var info = tableInfo.asObject();

          // extend table object with information from TableInfo instance
          $.extend(table, info);
          table.health_label_class = colorMapLabel[table.health];
          table.health_panel_class = colorMapPanel[table.health];
          table.type_display_name = table.table_schema == 'blob' ? 'TABLE.BLOBS' : 'TABLE.RECORDS';

          // Create table summary
          var translate = $filter('translate');
          var summary = `${table.shards_configured} ${translate('TABLE.SHARDS')}`;
          summary += ` / ${table.replicas_configured} ${translate('TABLE.REPLICAS')}`;
          if (table.records_unavailable) {
            summary = `${roundWithUnitFilter(table.records_unavailable, 1)} ${translate('TABLE.RECORDS_UNAVAILABLE')} / ${summary}`;
          } else if (table.shards_underreplicated) {
            summary = `${table.shards_underreplicated} ${translate('TABLE.SHARDS_UNDERREPLICATED')} / ${summary}`;
          }
          if (table.records_underreplicated) {
            summary = `${table.records_underreplicated} ${translate('TABLE.RECORDS_UNDERREPLICATED')} / ${summary}`;
          }
          table.summary = summary;
        }

        // sort tables by health and name
        data.tables = _tables.sort(sortByHealth);
      } else {
        data.tables = [];
      }

      return {
        'success': success,
        'data': data
      };
    };

    fetch = function (tables, shards, partitions, recovery) {
      if (tables && shards && partitions && recovery) {
        return update(true, tables, shards, partitions, recovery);
      }
      else if (jQuery.isEmptyObject([tables, shards, partitions, recovery])) {
        return;
      } else if (tables && shards && recovery) {
        return update(true, tables, shards, null, recovery);
      } else if (tables) {
        return update(true, tables);
      } else {
        return update(false);
      }
    };

    // initialize
    fetch();

    return {
      'data': data,
      'execute': fetch
    };

  });
export default tableinfo;
