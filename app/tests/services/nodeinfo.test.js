describe('NodeInfo', function() {

  var mockNodeInfo, $httpBackend, $q, baseURI;

  beforeEach(angular.mock.module('crate'));
  beforeEach(angular.mock.module('common'));
  beforeEach(angular.mock.module('shardinfo'));
  beforeEach(angular.mock.module('sql'));

  beforeEach(function() {
    angular.mock.inject(function($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $q = $injector.get('$q');
      mockNodeInfo = $injector.get('NodeInfo');
      baseURI = $injector.get('baseURI');
    });
  });

  describe('NodeInfo', function() {
    it('should execute executeNodeQuery ', inject(function(ClusterCheck, baseURI) {
      var data;
      $httpBackend.whenPOST(baseURI.getURI("/_sql"))
        .respond({
          "cols": ["id", "name", "hostname", "rest_url", "port", "heap", "fs", "os['cpu']", "load", "version", "os['probe_timestamp']", "process['cpu']", "os_info['available_processors']"],
          "rows": [
            ["PSET9VyuRCmb2qH9zXwC7w", "Ultner Hochwart", "local", null, {
              "http": 4200,
              "psql": 5432,
              "transport": 4300
            }, {
              "used": 70814920,
              "free": 4154422072,
              "max": 4225236992,
              "probe_timestamp": 1485965416783
            }, {
              "total": {
                "bytes_written": 0,
                "size": 511023933030400,
                "available": 330313918054400,
                "reads": 0,
                "bytes_read": 0,
                "used": 180441579520000,
                "writes": 0
              },
              "disks": [{
                "bytes_written": 0,
                "dev": "/dev/disk1",
                "size": 499046809600,
                "available": 322572185600,
                "reads": 0,
                "bytes_read": 0,
                "used": 176212480000,
                "writes": 0
              }],
              "data": [{
                "path": "/path",
                "dev": "/dev/disk1"
              }]
            }, {
              "system": 5,
              "stolen": 0,
              "used": 23,
              "idle": 77,
              "user": 18
            }, {
              "1": 2.38427734375,
              "15": 2.2744140625,
              "5": 2.37646484375,
              "probe_timestamp": 1485965416783
            }, {
              "build_snapshot": true,
              "number": "1.1.0",
              "build_hash": "5253870123c23dc0e9511f01269e14cdb878342d"
            }, 1485965416783, {
              "percent": 0,
              "user": 47036,
              "system": 15471
            }, 8]
          ],
          "rowcount": 1,
          "duration": 1.786328
        });

      mockNodeInfo.executeNodeQuery().then(function(response) {
        data = response;

        expect(data).toEqual([Object({
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
          num_cores: 8
        })]);
      });
      $httpBackend.flush();
    }));


  });

  describe('NodeInfo Service', function() {
    it('should execute executeClusterQuery ', inject(function(ClusterCheck, baseURI) {
      var data;
      $httpBackend.whenPOST(baseURI.getURI("/_sql"))
        .respond({
          "cols": ["name", "master_node"],
          "rows": [
            ["admin-ui-test", "PSET9VyuRCmb2qH9zXwC7w"]
          ],
          "rowcount": 1,
          "duration": 0.270695
        });

      mockNodeInfo.executeClusterQuery().then(function(response) {
        data = response;

        expect(data).toEqual([Object({
          name: 'admin-ui-test',
          master_node: 'PSET9VyuRCmb2qH9zXwC7w'
        })]);
      });
      $httpBackend.flush();
    }));


  });

});