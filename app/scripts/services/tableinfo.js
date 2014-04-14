'use strict';

angular.module('tableinfo', [])
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
              return shard.state in {'STARTED':'', 'RELOCATING':''} && shard.primary;
          });
          var numActivePrimaryShards = activePrimaryShards.reduce(function(memo, shard, idx) {
            return shard.count + memo;
          }, 0);
          return Math.max(this.shards_configured-numActivePrimaryShards, 0);
      };
      this.underreplicatedShards = function underreplicatedShards() {
          return this.unassignedShards() - this.missingShards();
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
          return primary.length ? (primary[0].avg_docs * this.underreplicatedShards()) : 0;
      };
      this.unavailableRecords = function unavailableRecords() {
          var started = this.startedShards();
          return started.length ? (started[0].avg_docs * this.missingShards()) : 0;
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
        return o;
      };
    };
  });
