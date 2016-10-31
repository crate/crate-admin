describe('tableinfo', function() {
  'use strict';

  var mockTableInfoService;

  beforeEach(angular.mock.module('crate'));
  beforeEach(angular.mock.module('common'));
  beforeEach(angular.mock.module('tableinfo'));
  beforeEach(angular.mock.module('sql'));

  beforeEach(function() {
    angular.mock.inject(function($injector) {
      mockTableInfoService = $injector.get('TableInfo');
    });
  });

  describe('mockTableInfoService', function() {
    it('should return table info object', inject(function(TableInfo) {
      var table_info;
      table_info = new TableInfo([{
        avg_docs: 0,
        count: 4,
        fqn: "doc.wheather",
        node_id: null,
        primary: false,
        relocating_node: null,
        routing_state: "UNASSIGNED",
        schema_name: "doc",
        size: 0,
        state: "UNASSIGNED",
        sum_docs: 0,
        table_name: "wheather",
      }], 4, null, [{
        count: 4,
        recovery_percent: null,
        recovery_stage: null,
        schema_name: "doc",
        table_name: "wheather",
      }])

      var info = table_info.asObject();
      expect(info).toEqual({
        shards_configured: 4,
        health: 'critical',
        shards_started: 0,
        shards_missing: 4,
        shards_underreplicated: 0,
        records_total: 0,
        records_total_with_replicas: 0,
        records_unavailable: 0,
        records_underreplicated: 0,
        size: 0,
        partitioned: false,
        partitioned_by: [],
        recovery_percent: 0
      });
    }));
  });
});
