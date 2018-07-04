describe('CompareByHealth Services', function() {

  var mockCompareByHealth;

  beforeEach(angular.mock.module('common'));
  beforeEach(angular.mock.module('crate'));
  beforeEach(angular.mock.module('nodeinfo'));
  beforeEach(function() {
    angular.mock.inject(function($injector) {
      mockCompareByHealth = $injector.get('compareByHealth');
    });
  });

  describe('mockCompareByHealth with master node', function() {
    var node_a = {
      "name": "Großstein",
      "health": {
        "value": 0,
        "status": "good"
      },
      "health_value": 0,
      "health_label_class": "label-success",
      "health_panel_class": "label-success",
      "master_node": true
    };

    var node_b = {
      "name": "Großhansl",
      "health": {
        "value": 0,
        "status": "good"
      },
      "health_value": 0,
      "health_label_class": "label-success",
      "health_panel_class": "label-success",
      "master_node": false
    };
    it('should return -1', inject(function() {
      expect(mockCompareByHealth(node_b, node_a)).toEqual(-1);
    }));

    it('should return 0', inject(function() {
      expect(mockCompareByHealth(node_a, node_a)).toEqual(0);
    }));

    it('should return 1', inject(function() {
      expect(mockCompareByHealth(node_a, node_b)).toEqual(1);
    }));
  });


  describe('mockCompareByHealth', function() {
    var node_a = {
      "name": "Großstein",
      "health": {
        "value": 1,
        "status": "warning"
      },
      "health_value": 1,
      "health_label_class": "label-warning",
      "health_panel_class": "label-warning",
      "master_node": true
    };

    var node_b = {
      "name": "Großhansl",
      "health": {
        "value": 0,
        "status": "good"
      },
      "health_value": 0,
      "health_label_class": "label-success",
      "health_panel_class": "label-success",
      "master_node": false
    };
    it('should return -1', inject(function() {
      expect(mockCompareByHealth(node_b, node_a)).toEqual(-1);
    }));

    it('should return 0', inject(function() {
      expect(mockCompareByHealth(node_a, node_a)).toEqual(0);
    }));

    it('should return 1', inject(function() {
      expect(mockCompareByHealth(node_a, node_b)).toEqual(1);
    }));
  });

  describe('mockCompareByHealth', function() {
    var node_a = {
      "name": "Großstein",
      "health": {
        "value": 0,
        "status": "warning"
      },
      "health_value": 0,
      "health_label_class": "label-success",
      "health_panel_class": "label-success",
      "master_node": true
    };

    var node_b = {
      "name": "Großhansl",
      "health": {
        "value": 2,
        "status": "critical"
      },
      "health_value": 2,
      "health_label_class": "label-danger",
      "health_panel_class": "label-danger",
      "master_node": false
    };
    it('should return 1', inject(function() {
      expect(mockCompareByHealth(node_b, node_a)).toEqual(1);
    }));

    it('should return 0', inject(function() {
      expect(mockCompareByHealth(node_a, node_a)).toEqual(0);
    }));

    it('should return -1', inject(function() {
      expect(mockCompareByHealth(node_a, node_b)).toEqual(-1);
    }));
  });
});
