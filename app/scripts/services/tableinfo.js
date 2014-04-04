'use strict';

angular.module('tableinfo', [])
  .factory('TableInfo', function(){
    return function TableInfo(shards) {
      this.shards = shards;
      this.shards_configured = 0;
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
          if (this.primaryShards().length === 0) return 'critical';
          if (this.missingShards() > 0) return 'critical';
          if (this.unassignedShards() > 0) return 'warning';
          return 'good';
      };
    };
  });
