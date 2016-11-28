describe('NodeHealth Services', function() {

  var mockNodeHealthService;

  beforeEach(module('common'));
  beforeEach(module('crate'));
  beforeEach(module('nodeinfo'));
  beforeEach(function() {
    angular.mock.inject(function($injector) {
      mockNodeHealthService = $injector.get('NodeHealth');
    });
  });

  describe('mockNodeHealthService', function() {

    it('health status should equal critical', inject(function() {
      var node_a = {
        "heap": {
          "used_percent": 99,
        },
        "fs": {
          "used_percent": 0
        }
      };

      var HEALTH = new mockNodeHealthService(node_a);
      expect(HEALTH.value).toEqual(2);
      expect(HEALTH.status).toEqual('critical');
    }));

    it('health status should equal warning', inject(function() {
      var node_a = {
        "heap": {
          "used_percent": 0,
        },
        "fs": {
          "used_percent": 97
        }
      };

      var HEALTH = new mockNodeHealthService(node_a);
      expect(HEALTH.value).toEqual(1);
      expect(HEALTH.status).toEqual('warning');
    }));

    it('health status should equal good', inject(function() {
      var node_a = {
        "heap": {
          "used_percent": 34,
        },
        "fs": {
          "used_percent": 45
        }
      };

      var HEALTH = new mockNodeHealthService(node_a);
      expect(HEALTH.value).toEqual(0);
      expect(HEALTH.status).toEqual('good');
    }));
  });

});