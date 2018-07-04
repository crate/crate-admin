describe('prepareNodeList', function() {
  'use strict';

  var mockPrepareNodeList;

  beforeEach(angular.mock.module('common'));
  beforeEach(angular.mock.module('crate'));
  beforeEach(angular.mock.module('nodeinfo'));
  beforeEach(function() {
    angular.mock.inject(function($injector) {
      mockPrepareNodeList = $injector.get('prepareNodeList');
    });
  });

  describe('mockPrepareNodeList ', function() {

    it('should return nodeList', inject(function() {
      var master_node = 'PSET9VyuRCmb2qH9zXwC7w';
      var cluster = [{
        'cpu': {
          'idle': 76,
          'stolen': 0,
          'system': 6,
          'used': 24,
          'user': 18
        },
        'fs': {
          'data': {
            'dev': "/dev/disk1",
            'path': "/path"
          },
          'disks': [{
            'available': 322576674816,
            'bytes_read': 0,
            'bytes_written': 0,
            'dev': "/dev/disk1",
            'reads': 0,
            'size': 499046809600,
            'used': 176207990784,
            'writes': 0,
          }],
          'total': {
            'vailable': 330318515011584,
            'bytes_read': 0,
            'bytes_written': 0,
            'reads': 0,
            'size': 511023933030400,
            'used': 180436982562816,
            'writes': 0
          }
        },
        'heap': {
          'free': 4151047432,
          'max': 4225236992,
          'probe_timestamp': 1485962564800,
          'used': 74189560
        },
        'isostats': {
          'rbps': -1,
          'rps': -1,
          'wbps': -1,
          'wps': -1
        },
        'load': {
          '1': 2.27490234375,
          '5': 2.1943359375,
          '15': 2.18603515625,
          'probe_timestamp': 1485962564801
        },
        'port': {
          'http': 4200,
          'psql': 5432,
          'transport': 4300
        },
        'name': "Ultner Hochwart",
        'id': "PSET9VyuRCmb2qH9zXwC7w",
        'num_cores': 8,
      }];

      var nodeList = mockPrepareNodeList(cluster, master_node);
      expect(nodeList.length).toBe(1);
      expect(nodeList[0].master_node).toEqual(true);
      expect(nodeList[0].id).toEqual('PSET9VyuRCmb2qH9zXwC7w');
      expect(nodeList[0].health_label_class).toEqual('label-success');   
    }));

  });

});
