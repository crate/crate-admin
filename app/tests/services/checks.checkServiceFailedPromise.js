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
        var d = $q.defer();
        d.reject();
        return d.promise;
      });

      NodeCheckSpy = spyOn(mockNodeCheck, 'execute').and.callFake(function() {
        var d = $q.defer();
        d.reject();
        return d.promise;
      });
    });
  });

  beforeEach(function() {
    angular.mock.inject(function($injector) {
      mockChecksService = $injector.get('ChecksService');
    });
  });

  it('should reject promise', function() {
    mockChecksService.refresh();
    rootScope.$apply();

    expect(mockChecksService.checks.cluster_checks).toEqual(undefined);
    expect(mockChecksService.checks.node_checks).toEqual(undefined);


    expect(mockChecksService.success).toEqual(false);
  });

});