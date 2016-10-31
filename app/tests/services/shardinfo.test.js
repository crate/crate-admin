describe('shardinfo', function() {
  'use strict';

  var mockShardInfoService, $httpBackend, $q, SQLQuery, queryResultToObjects, baseURI;

  beforeEach(angular.mock.module('crate'));
  beforeEach(angular.mock.module('common'));
  beforeEach(angular.mock.module('shardinfo'));
  beforeEach(angular.mock.module('sql'));

  beforeEach(function() {
    angular.mock.inject(function($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $q = $injector.get('$q');
      SQLQuery = $injector.get('SQLQuery');
      queryResultToObjects = $injector.get('queryResultToObjects');
      mockShardInfoService = $injector.get('ShardInfo');
      baseURI = $injector.get('baseURI');
    });
  });

  describe('ShardInfo Service', function() {
    it('should executeTableStmt', inject(function(ShardInfo, baseURI) {
      var data;
      $httpBackend.whenPOST(baseURI.getURI("/_sql"))
        .respond({
          "cols": ["table_name", "table_schema", "fqn", "number_of_shards", "number_of_replicas", "partitioned_by"],
          "rows": [
            ["crate_test", "test", "test.crate_test", 6, "1", null],
          ],
          "rowcount": 21,
          "duration": 3.140416

        });
      mockShardInfoService.executeTableStmt().then(function(response) {
        data = response;

        expect(data).toEqual([{
          name: 'crate_test',
          table_schema: 'test',
          fqn: 'test.crate_test',
          shards_configured: 6,
          replicas_configured: '1',
          partitioned_by: null
        }]);
      });
      $httpBackend.flush();
    }));

    it('should executeShardStmt', inject(function(ShardInfo, baseURI) {
      var data;
      $httpBackend.whenPOST(baseURI.getURI("/_sql"))
        .respond({
          "cols": ["table_name", "schema_name", "fqn", "node_id", "state", "routing_state", "relocating_node", "count(*)", "primary", "sum(num_docs)", "avg(num_docs)", "sum(size)"],
          "rows": [
            ["crate_test", "test", "test.crate_test", "Aymv-_hYSFilAqwO739Rdw", "STARTED", "STARTED", null, 2, true, 0.0, 0.0, 320.0],
          ],
          "rowcount": 35,
          "duration": 2.804894
        });
      mockShardInfoService.executeShardStmt().then(function(response) {
        data = response;

        expect(data).toEqual([{
          table_name: 'crate_test',
          schema_name: 'test',
          fqn: 'test.crate_test',
          node_id: 'Aymv-_hYSFilAqwO739Rdw',
          state: 'STARTED',
          routing_state: 'STARTED',
          relocating_node: null,
          count: 2,
          primary: true,
          sum_docs: 0,
          avg_docs: 0,
          size: 320
        }]);
      });
      $httpBackend.flush();
    }));

    it('should executePartStmt', inject(function(ShardInfo, baseURI) {
      var data;
      $httpBackend.whenPOST(baseURI.getURI("/_sql"))
        .respond({
          "cols": ["table_name", "schema_name", "fqn", "num_shards"],
          "rows": [
            ["probe_requests", "doc", "doc.probe_requests", 1.0],
          ],
          "rowcount": 2,
          "duration": 1.334181
        });
      mockShardInfoService.executePartStmt().then(function(response) {
        data = response;
        expect(data).toEqual([{
          table_name: 'probe_requests',
          schema_name: 'doc',
          fqn: 'doc.probe_requests',
          num_shards: 1
        }]);
      });
      $httpBackend.flush();
    }));

    it('should executeRecoveryStmt', inject(function(ShardInfo, baseURI) {
      var data;
      $httpBackend.whenPOST(baseURI.getURI("/_sql"))
        .respond({
          "cols": ["table_name", "schema_name", "recovery_stage", "avg(recovery['size']['percent'])", "count"],
          "rows": [
            ["crate_test", "test", "DONE", 100.0, 2],
          ],
          "rowcount": 35,
          "duration": 1.137426
        });
      mockShardInfoService.executeRecoveryStmt().then(function(response) {
        data = response;
        expect(data).toEqual([{
          table_name: 'crate_test',
          schema_name: 'test',
          recovery_stage: 'DONE',
          recovery_percent: 100,
          count: 2
        }]);
      });
      $httpBackend.flush();
    }));
  });
});
