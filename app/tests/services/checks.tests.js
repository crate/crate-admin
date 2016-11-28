describe('ClusterCheck', function() {

  var mockClusterCheck, $httpBackend, $q, baseURI;

  beforeEach(angular.mock.module('crate'));
  beforeEach(angular.mock.module('common'));
  beforeEach(angular.mock.module('shardinfo'));
  beforeEach(angular.mock.module('sql'));

  beforeEach(function() {
    angular.mock.inject(function($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $q = $injector.get('$q');
      mockClusterCheck = $injector.get('ClusterCheck');
      baseURI = $injector.get('baseURI');
    });
  });

  describe('ClusterCheck Service', function() {
    it('should execute cluster check query ', inject(function(ClusterCheck, baseURI) {
      var data;
      $httpBackend.whenPOST(baseURI.getURI("/_sql"))
        .respond({
          "cols": ["id", "severity", "description", "passed"],
          "rows": [
            [1, 3, "The setting 'discovery.zen.minimum_master_nodes' must not be less than half + 1 of eligible master nodes in the cluster. It should be set to (number_master_nodes / 2) + 1. https://cr8.is/d-cluster-check-1", false]
          ],
          "rowcount": 1,
          "duration": 1.825851
        });

      mockClusterCheck.execute().then(function(response) {
        data = response;

        expect(data).toEqual([{
          id: 1,
          severity: 3,
          description: "The setting 'discovery.zen.minimum_master_nodes' must not be less than half + 1 of eligible master nodes in the cluster. It should be set to (number_master_nodes / 2) + 1. https://cr8.is/d-cluster-check-1",
          passed: false
        }]);
      });
      $httpBackend.flush();
    }));


  });

});

describe('NodeCheck', function() {

  var mockNodeCheck, $httpBackend, $q, baseURI;

  beforeEach(angular.mock.module('crate'));
  beforeEach(angular.mock.module('common'));
  beforeEach(angular.mock.module('shardinfo'));
  beforeEach(angular.mock.module('sql'));

  beforeEach(function() {
    angular.mock.inject(function($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $q = $injector.get('$q');
      mockNodeCheck = $injector.get('NodeCheck');
      baseURI = $injector.get('baseURI');
    });
  });

  describe('NodeCheck Service', function() {
    it('should execute node check query', inject(function(NodeCheck, baseURI) {
      var data;
      $httpBackend.whenPOST(baseURI.getURI("/_sql"))
        .respond({
          "cols": ["id", "severity", "description", "passed", "node_id", "name", "acknowledged"],
          "rows": [
            [1, 3, "The value of the cluster setting 'gateway.expected_nodes' must be equal to the maximum/expected number of master and data nodes in the cluster. https://cr8.is/d-node-check-1", false, "fedY7M0qTiCOdGWr2Wunlw", "Vorderunnütz", false],
            [1, 3, "The value of the cluster setting 'gateway.expected_nodes' must be equal to the maximum/expected number of master and data nodes in the cluster. https://cr8.is/d-node-check-1", false, "nPdyiIBVR-esw9JRUQn3mw", "Liskamm", false],
            [2, 3, "The value of the cluster setting 'gateway.recover_after_nodes' needs to be greater than half of the maximum/expected number of nodes and equal or less than the maximum/expected number of nodes in the cluster. https://cr8.is/d-node-check-2", false, "fedY7M0qTiCOdGWr2Wunlw", "Vorderunnütz", false],
            [2, 3, "The value of the cluster setting 'gateway.recover_after_nodes' needs to be greater than half of the maximum/expected number of nodes and equal or less than the maximum/expected number of nodes in the cluster. https://cr8.is/d-node-check-2", false, "nPdyiIBVR-esw9JRUQn3mw", "Liskamm", false],
            [1, 3, "The value of the cluster setting 'gateway.expected_nodes' must be equal to the maximum/expected number of master and data nodes in the cluster. https://cr8.is/d-node-check-1", false, "SyKhWuL4QsWGGRs2TOwIyw", "Rotenkogel", false],
            [2, 3, "The value of the cluster setting 'gateway.recover_after_nodes' needs to be greater than half of the maximum/expected number of nodes and equal or less than the maximum/expected number of nodes in the cluster. https://cr8.is/d-node-check-2", false, "SyKhWuL4QsWGGRs2TOwIyw", "Rotenkogel", false]
          ],
          "rowcount": 6,
          "duration": 5.373395
        });

      mockNodeCheck.execute().then(function(response) {
        data = response;

        expect(data).toEqual([{
          id: 1,
          severity: 3,
          description: "The value of the cluster setting 'gateway.expected_nodes' must be equal to the maximum/expected number of master and data nodes in the cluster. https://cr8.is/d-node-check-1",
          passed: false,
          node_id: 'fedY7M0qTiCOdGWr2Wunlw',
          node_name: 'Vorderunnütz',
          acknowledged: false,
          nodes: [{
            name: 'Vorderunnütz',
            id: 'fedY7M0qTiCOdGWr2Wunlw'
          }, {
            name: 'Liskamm',
            id: 'nPdyiIBVR-esw9JRUQn3mw'
          }, {
            name: 'Rotenkogel',
            id: 'SyKhWuL4QsWGGRs2TOwIyw'
          }]
        }, {
          id: 2,
          severity: 3,
          description: "The value of the cluster setting 'gateway.recover_after_nodes' needs to be greater than half of the maximum/expected number of nodes and equal or less than the maximum/expected number of nodes in the cluster. https://cr8.is/d-node-check-2",
          passed: false,
          node_id: 'fedY7M0qTiCOdGWr2Wunlw',
          node_name: 'Vorderunnütz',
          acknowledged: false,
          nodes: [{
            name: 'Vorderunnütz',
            id: 'fedY7M0qTiCOdGWr2Wunlw'
          }, {
            name: 'Liskamm',
            id: 'nPdyiIBVR-esw9JRUQn3mw'
          }, {
            name: 'Rotenkogel',
            id: 'SyKhWuL4QsWGGRs2TOwIyw'
          }]
        }]);
      });
      $httpBackend.flush();
    }));
  });
});

describe('ChecksService', function() {

  var mockChecksService, $httpBackend, $q, baseURI;

  beforeEach(angular.mock.module('crate'));
  beforeEach(angular.mock.module('common'));
  beforeEach(angular.mock.module('shardinfo'));
  beforeEach(angular.mock.module('sql'));

  beforeEach(function() {
    angular.mock.inject(function($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $timeout = $injector.get('$timeout');
      mockChecksService = $injector.get('ChecksService');
      baseURI = $injector.get('baseURI');
    });
  });

  describe('ChecksService', function() {
    it('should refresh', inject(function(ClusterCheck, baseURI, $timeout) {
      var data;
      $httpBackend.whenPOST(baseURI.getURI("/_sql"))
        .respond({
          "cols": ["id", "severity", "description", "passed"],
          "rows": [
            [1, 3, "The setting 'discovery.zen.minimum_master_nodes' must not be less than half + 1 of eligible master nodes in the cluster. It should be set to (number_master_nodes / 2) + 1. https://cr8.is/d-cluster-check-1", false]
          ],
          "rowcount": 1,
          "duration": 1.825851
        });

      mockChecksService.refresh();


      $timeout(function assert() {
        expect(mockChecksService.success).toEqual(true);

        expect(mockChecksService.checks.cluster_checks).toEqual({
          id: 1,
          severity: 3,
          description: "The setting 'discovery.zen.minimum_master_nodes' must not be less than half + 1 of eligible master nodes in the cluster. It should be set to (number_master_nodes / 2) + 1. https://cr8.is/d-cluster-check-1",
          passed: false
        });
        $httpBackend.flush();
        $timeout.verifyNoPendingTasks();
        done();
      }, 6000);



    }));


  });

});