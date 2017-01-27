describe('ChecksService', function() {
  var deferred, rootScope;

  var mockChecksService, mockClusterCheck, mockNodeCheck, $httpBackend, $q, baseURI, ClusterCheckSpy, NodeCheckSpy;

  beforeEach(angular.mock.module('crate'));
  beforeEach(angular.mock.module('common'));
  beforeEach(angular.mock.module('sql'));

  beforeEach(function() {
    angular.mock.inject(function($injector) {
      rootScope = $injector.get('$rootScope');
      mockClusterCheck = $injector.get('ClusterCheck');
      mockNodeCheck = $injector.get('NodeCheck');
      $q = $injector.get('$q');

      ClusterCheckSpy = spyOn(mockClusterCheck, 'execute').and.callFake(function() {
        var data1 = {
          'cols': ['id', 'severity', 'description', 'passed', 'node_id', 'name', 'acknowledged'],
          'rows': [
            [1, 3, 'The value of the cluster setting gateway.expected_nodes must be equal to the maximum/expected number of master and data nodes in the cluster. https://cr8.is/d-node-check-1', false, 'fedY7M0qTiCOdGWr2Wunlw', 'Vorderunnütz', false]
          ],
          'rowcount': 1,
          'duration': 5.373395
        };
        var d = $q.defer();
        d.resolve(data1);
        return d.promise;
      });

      NodeCheckSpy = spyOn(mockNodeCheck, 'execute').and.callFake(function() {
        var data2 = {
          'cols': ['id', 'severity', 'description', 'passed'],
          'rows': [
            [1, 3, 'The setting discovery.zen.minimum_master_nodes must not be less than half + 1 of eligible master nodes in the cluster. It should be set to (number_master_nodes / 2) + 1. https://cr8.is/d-cluster-check-1', false]
          ],
          'rowcount': 1,
          'duration': 1.825851
        };
        var d = $q.defer();
        d.resolve(data2);
        return d.promise;
      });
    });
  });

  beforeEach(function() {
    angular.mock.inject(function($injector) {
      mockChecksService = $injector.get('ChecksService');
    });
  });

  it('should resolve promise', function() {
    mockChecksService.refresh();
    rootScope.$apply();

    expect(mockChecksService.checks.cluster_checks).toEqual({
      cols: ['id', 'severity', 'description', 'passed', 'node_id', 'name', 'acknowledged'],
      rows: [
        [1, 3, 'The value of the cluster setting gateway.expected_nodes must be equal to the maximum/expected number of master and data nodes in the cluster. https://cr8.is/d-node-check-1', false, 'fedY7M0qTiCOdGWr2Wunlw', 'Vorderunnütz', false]
      ],
      rowcount: 1,
      duration: 5.373395
    });
    expect(mockChecksService.checks.node_checks).toEqual({
      'cols': ['id', 'severity', 'description', 'passed'],
      'rows': [
        [1, 3, 'The setting discovery.zen.minimum_master_nodes must not be less than half + 1 of eligible master nodes in the cluster. It should be set to (number_master_nodes / 2) + 1. https://cr8.is/d-cluster-check-1', false]
      ],
      'rowcount': 1,
      'duration': 1.825851
    });


    expect(mockChecksService.success).toEqual(true);
  });

});