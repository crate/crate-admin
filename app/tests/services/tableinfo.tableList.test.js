describe('tableinfo TableList', function() {
  'use strict';

  var mockTableList, $rootScope, mockShardInfo, ShardInfoSpy;

  beforeEach(angular.mock.module('crate'));
  beforeEach(angular.mock.module('common'));
  beforeEach(angular.mock.module('tableinfo'));
  beforeEach(angular.mock.module('sql'));

  beforeEach(function() {
    angular.mock.inject(function($injector) {
      mockTableList = $injector.get('TableList');
      $rootScope = $injector.get('$rootScope');
      mockShardInfo = $injector.get('ShardInfo');
    });
  });

  describe('mockTableList', function() {
    it('should return table list object', inject(function() {
      var data1 = {
        partitions: [],
        recovery: [{
          count: 4,
          recovery_percent: null,
          recovery_stage: null,
          schema_name: "doc",
          table_name: "insert_test2"
        }, {
          count: 4,
          recovery_percent: null,
          recovery_stage: null,
          schema_name: "doc",
          table_name: "insert_test"
        }, {
          count: 4,
          recovery_percent: 0,
          recovery_stage: "DONE",
          schema_name: "doc",
          table_name: "insert_test2"
        }, {
          count: 4,
          recovery_percent: 0,
          recovery_stage: "DONE",
          table_name: "insert_test"
        }],
        shards: [{
          avg_docs: 0.25,
          count: 4,
          fqn: "doc.insert_test",
          node_id: "PSET9VyuRCmb2qH9zXwC7w",
          primary: true,
          relocating_node: null,
          routing_state: "STARTED",
          schema_name: "doc",
          size: 3578,
          state: "STARTED",
          sum_docs: 1,
          table_name: "insert_test"
        }, {
          avg_docs: 0,
          count: 4,
          fqn: "doc.insert_test2",
          node_id: null,
          primary: false,
          relocating_node: null,
          routing_state: "UNASSIGNED",
          schema_name: "doc",
          size: 0,
          state: "UNASSIGNED",
          sum_docs: 0,
          table_name: "insert_test2"
        }, {
          avg_docs: 0,
          count: 4,
          fqn: "doc.insert_test2",
          node_id: "PSET9VyuRCmb2qH9zXwC7w",
          primary: true,
          relocating_node: null,
          routing_state: "STARTED",
          schema_name: "doc",
          size: 636,
          state: "STARTED",
          sum_docs: 0,
          table_name: "insert_test2"
        }, {
          avg_docs: 0,
          count: 4,
          fqn: "doc.insert_test",
          node_id: null,
          primary: false,
          relocating_node: null,
          routing_state: "UNASSIGNED",
          schema_name: "doc",
          size: 0,
          state: "UNASSIGNED",
          sum_docs: 0,
          table_name: "insert_test"
        }],
        tables: [{
          fqn: "doc.insert_test",
          health: "warning",
          health_label_class: "label-warning",
          health_panel_class: "cr-panel--warning",
          name: "insert_test",
          partitioned: false,
          partitioned_by: [],
          records_total: 1,
          records_total_with_replicas: 2,
          records_unavailable: 0,
          records_underreplicated: 1,
          recovery_percent: 50,
          replicas_configured: "1",
          shards_configured: 4,
          shards_missing: 0,
          shards_started: 4,
          shards_underreplicated: 4,
          size: 3578,
          summary: "1 Underreplicated Records / 4 Underreplicated Shards / 4 Shards / 1 Replicas",
          table_schema: "doc",
          type_display_name: "TABLE.RECORDS"
        }, {
          fqn: "doc.insert_test2",
          health: "warning",
          health_label_class: "label-warning",
          health_panel_class: "cr-panel--warning",
          name: "insert_test2",
          partitioned: false,
          partitioned_by: Array[0],
          records_total: 0,
          records_total_with_replicas: 0,
          records_unavailable: 0,
          records_underreplicated: 0,
          recovery_percent: 50,
          replicas_configured: "1",
          shards_configured: 4,
          shards_missing: 0,
          shards_started: 4,
          shards_underreplicated: 4,
          size: 636,
          summary: "4 Underreplicated Shards / 4 Shards / 1 Replicas",
          table_schema: "doc",
          type_display_name: "TABLE.RECORDS"
        }]
      };

      mockShardInfo.deferred.resolve(data1);
      $rootScope.$apply();

      mockTableList.fetch();
      $rootScope.$apply();

      expect(mockTableList.data).toEqual({
        tables: [Object({
          fqn: 'doc.insert_test',
          health: 'warning',
          health_label_class: 'label-warning',
          health_panel_class: 'cr-panel--warning',
          name: 'insert_test',
          partitioned: false,
          partitioned_by: [],
          records_total: 1,
          records_total_with_replicas: 2,
          records_unavailable: 0,
          records_underreplicated: 1,
          recovery_percent: 0,
          replicas_configured: '1',
          shards_configured: 4,
          shards_missing: 0,
          shards_started: 4,
          shards_underreplicated: 4,
          size: 3578,
          summary: '1 Underreplicated Records / 4 Underreplicated Shards / 4 Shards / 1 Replicas',
          table_schema: 'doc',
          type_display_name: 'TABLE.RECORDS'
        }), Object({
          fqn: 'doc.insert_test2',
          health: 'warning',
          health_label_class: 'label-warning',
          health_panel_class: 'cr-panel--warning',
          name: 'insert_test2',
          partitioned: false,
          partitioned_by: [],
          records_total: 0,
          records_total_with_replicas: 0,
          records_unavailable: 0,
          records_underreplicated: 0,
          recovery_percent: 50,
          replicas_configured: '1',
          shards_configured: 4,
          shards_missing: 0,
          shards_started: 4,
          shards_underreplicated: 4,
          size: 636,
          summary: '4 Underreplicated Shards / 4 Shards / 1 Replicas',
          table_schema: 'doc',
          type_display_name: 'TABLE.RECORDS'
        })]
      });
    }));

    it('should reject request', inject(function() {


      mockShardInfo.deferred.reject();
      $rootScope.$apply();

      mockTableList.fetch();
      $rootScope.$apply();

      expect(mockTableList.data).toEqual({ tables: [  ] });
    }));

  });
});