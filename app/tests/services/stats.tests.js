describe('ClusterState ', function() {
  'use strict';

  var mockClusterState, $timeout, $httpBackend, baseURI, rootScope,
    mockNodeInfo, mockShardInfo, $q;

  beforeEach(angular.mock.module('crate'));
  beforeEach(angular.mock.module('common'));
  beforeEach(angular.mock.module('stats'));

  beforeEach(function() {
    angular.mock.inject(function($injector) {
      $timeout = $injector.get('$timeout');
      $httpBackend = $injector.get('$httpBackend');
      baseURI = $injector.get('baseURI');

      rootScope = $injector.get('$rootScope');
      mockNodeInfo = $injector.get('NodeInfo');
      mockShardInfo = $injector.get('ShardInfo');
      $q = $injector.get('$q');

      spyOn(mockNodeInfo, 'executeNodeQuery').and.callFake(function() {
        var data1 =
          [{
            id: 'PSET9VyuRCmb2qH9zXwC7w',
            name: 'Ultner Hochwart',
            hostname: 'local',
            rest_url: null,
            port: {
              http: 4200,
              psql: 5432,
              transport: 4300
            },
            heap: {
              used: 70814920,
              free: 4154422072,
              max: 4225236992,
              probe_timestamp: 1485965416783
            },
            fs: {
              total: {
                bytes_written: 0,
                size: 511023933030400,
                available: 330313918054400,
                reads: 0,
                bytes_read: 0,
                used: 180441579520000,
                writes: 0
              },
              disks: [{
                bytes_written: 0,
                dev: '/dev/disk1',
                size: 499046809600,
                available: 322572185600,
                reads: 0,
                bytes_read: 0,
                used: 176212480000,
                writes: 0
              }],
              data: [{
                path: '/path',
                dev: '/dev/disk1'
              }]
            },
            cpu: {
              system: 5,
              stolen: 0,
              used: 23,
              idle: 77,
              user: 18
            },
            load: {
              1: 2.38427734375,
              5: 2.37646484375,
              15: 2.2744140625,
              probe_timestamp: 1485965416783
            },
            version: {
              build_snapshot: true,
              number: '1.1.0',
              build_hash: '5253870123c23dc0e9511f01269e14cdb878342d'
            },
            timestamp: 1485965416783,
            proc_cpu: {
              percent: 0,
              user: 47036,
              system: 15471
            },
            num_cores: 8
          }];
        var d = $q.defer();
        d.resolve(data1);
        return d.promise;
      });
      spyOn(mockNodeInfo, 'executeClusterQuery').and.callFake(function() {
        var data1 = [Object({
          name: 'admin-ui-test',
          master_node: 'PSET9VyuRCmb2qH9zXwC7w'
        })];
        var d = $q.defer();
        d.resolve(data1);
        return d.promise;
      });

      //shardInfo
      spyOn(mockShardInfo, 'executeTableStmt').and.callFake(function() {
        var data2 = [{
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
          partitioned_by: [],
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
        }];
        var d = $q.defer();
        d.resolve(data2);
        return d.promise;
      });

      spyOn(mockShardInfo, 'executeShardStmt').and.callFake(function() {
        var data2 = [{
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
        }];
        var d = $q.defer();
        d.resolve(data2);
        return d.promise;
      });

      spyOn(mockShardInfo, 'executePartStmt').and.callFake(function() {
        var data2 = [];
        var d = $q.defer();
        d.resolve(data2);
        return d.promise;
      });

      spyOn(mockShardInfo, 'executeRecoveryStmt').and.callFake(function() {
        var data2 = [{
          Objectcount: 4,
          recovery_percent: null,
          recovery_stage: null,
          schema_name: "doc",
          table_name: "insert_test2"
        }, {
          Objectcount: 4,
          recovery_percent: null,
          recovery_stage: null,
          schema_name: "doc",
          table_name: "insert_test"
        }, {
          Objectcount: 4,
          recovery_percent: 0,
          recovery_stage: "DONE",
          schema_name: "doc",
          table_name: "insert_test"
        }, {
          Objectcount: 4,
          recovery_percent: 0,
          recovery_stage: "DONE",
          schema_name: "doc",
          table_name: "insert_test2"
        }];
        var d = $q.defer();
        d.resolve(data2);
        return d.promise;
      });
      mockClusterState = $injector.get('ClusterState');

    });
  });

  describe('ClusterState', function() {
    it('should return ClusterState', inject(function() {
      $httpBackend.whenGET(baseURI.getURI("/"))
        .respond({
          cluster_name: "admin-ui-test",
          name: "Ultner Hochwart",
          ok: true,
          status: 200,
          version: {
            build_hash: "5253870123c23dc0e9511f01269e14cdb878342d",
            build_snapshot: true,
            build_timestamp: "2017-02-01T13:17:03Z",
            es_version: "2.4.2",
            lucene_version: "5.5.2",
            number: "1.1.0"
          }
        });
      rootScope.$apply();
      mockClusterState.data;
      $timeout.flush();
      expect(mockClusterState.data).toEqual(Object({
        online: true,
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
          recovery_percent: NaN,
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
          recovery_percent: NaN,
          replicas_configured: '1',
          shards_configured: 4,
          shards_missing: 0,
          shards_started: 4,
          shards_underreplicated: 4,
          size: 636,
          summary: '4 Underreplicated Shards / 4 Shards / 1 Replicas',
          table_schema: 'doc',
          type_display_name: 'TABLE.RECORDS'
        })],
        shards: [Object({
          avg_docs: 0.25,
          count: 4,
          fqn: 'doc.insert_test',
          node_id: 'PSET9VyuRCmb2qH9zXwC7w',
          primary: true,
          relocating_node: null,
          routing_state: 'STARTED',
          schema_name: 'doc',
          size: 3578,
          state: 'STARTED',
          sum_docs: 1,
          table_name: 'insert_test'
        }), Object({
          avg_docs: 0,
          count: 4,
          fqn: 'doc.insert_test2',
          node_id: null,
          primary: false,
          relocating_node: null,
          routing_state: 'UNASSIGNED',
          schema_name: 'doc',
          size: 0,
          state: 'UNASSIGNED',
          sum_docs: 0,
          table_name: 'insert_test2'
        }), Object({
          avg_docs: 0,
          count: 4,
          fqn: 'doc.insert_test2',
          node_id: 'PSET9VyuRCmb2qH9zXwC7w',
          primary: true,
          relocating_node: null,
          routing_state: 'STARTED',
          schema_name: 'doc',
          size: 636,
          state: 'STARTED',
          sum_docs: 0,
          table_name: 'insert_test2'
        }), Object({
          avg_docs: 0,
          count: 4,
          fqn: 'doc.insert_test',
          node_id: null,
          primary: false,
          relocating_node: null,
          routing_state: 'UNASSIGNED',
          schema_name: 'doc',
          size: 0,
          state: 'UNASSIGNED',
          sum_docs: 0,
          table_name: 'insert_test'
        })],
        partitions: [],
        cluster: [Object({
          id: 'PSET9VyuRCmb2qH9zXwC7w',
          name: 'Ultner Hochwart',
          hostname: 'local',
          rest_url: null,
          port: Object({
            http: 4200,
            psql: 5432,
            transport: 4300
          }),
          heap: Object({
            used: 70814920,
            free: 4154422072,
            max: 4225236992,
            probe_timestamp: 1485965416783
          }),
          fs: Object({
            total: Object({
              bytes_written: 0,
              size: 511023933030400,
              available: 330313918054400,
              reads: 0,
              bytes_read: 0,
              used: 180441579520000,
              writes: 0
            }),
            disks: [Object({
              bytes_written: 0,
              dev: '/dev/disk1',
              size: 499046809600,
              available: 322572185600,
              reads: 0,
              bytes_read: 0,
              used: 176212480000,
              writes: 0
            })],
            data: [Object({
              path: '/path',
              dev: '/dev/disk1'
            })]
          }),
          cpu: Object({
            system: 5,
            stolen: 0,
            used: 23,
            idle: 77,
            user: 18
          }),
          load: Object({
            1: 2.38427734375,
            5: 2.37646484375,
            15: 2.2744140625,
            probe_timestamp: 1485965416783
          }),
          version: Object({
            build_snapshot: true,
            number: '1.1.0',
            build_hash: '5253870123c23dc0e9511f01269e14cdb878342d'
          }),
          timestamp: 1485965416783,
          proc_cpu: Object({
            percent: 0,
            user: 47036,
            system: 15471
          }),
          num_cores: 8,
          iostats: Object({
            rps: -1,
            wps: -1,
            rbps: -1,
            wbps: -1
          })
        })],
        name: 'admin-ui-test',
        status: 'warning',
        load: [2.38427734375, 2.37646484375, 2.2744140625],
        loadHistory: [[2.38427734375], [2.37646484375], [2.2744140625]],
        version: null,
        recovery: [Object({
          Objectcount: 4,
          recovery_percent: null,
          recovery_stage: null,
          schema_name: 'doc',
          table_name: 'insert_test2'
        }), Object({
          Objectcount: 4,
          recovery_percent: null,
          recovery_stage: null,
          schema_name: 'doc',
          table_name: 'insert_test'
        }), Object({
          Objectcount: 4,
          recovery_percent: 0,
          recovery_stage: 'DONE',
          schema_name: 'doc',
          table_name: 'insert_test'
        }), Object({
          Objectcount: 4,
          recovery_percent: 0,
          recovery_stage: 'DONE',
          schema_name: 'doc',
          table_name: 'insert_test2'
        })],
        master_node: 'PSET9VyuRCmb2qH9zXwC7w'
      }));
    }));
  });
});
