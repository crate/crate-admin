describe('NodeInfo Services', function() {

  var mockNodeInfoService, $httpBackend, baseURI;

  beforeEach(module('common'));
  beforeEach(module('crate'));
  beforeEach(module('nodeinfo'));
  beforeEach(function() {
    angular.mock.inject(function($injector) {
      mockNodeInfoService = $injector.get('NodeInfo');
      $httpBackend = $injector.get('$httpBackend');
      baseURI = $injector.get('baseURI');
    });
  });

  describe('mockNodeInfoService', function() {
    it('should execute cluster query ', inject(function(baseURI) {
      var data;
      $httpBackend.whenPOST(baseURI.getURI("/_sql"))
        .respond({
          "cols": ["name", "master_node"],
          "rows": [
            ["crate", "alY3ls2jQfqgYNRIVNDtfQ"]
          ],
          "rowcount": 1,
          "duration": 0.445588
        });

      mockNodeInfoService.executeClusterQuery().then(function(response) {
        data = response;

        expect(data).toEqual([{
          name: 'crate',
          master_node: 'alY3ls2jQfqgYNRIVNDtfQ'
        }]);
      });
      $httpBackend.flush();
    }));


    it('should execute node query ', inject(function(baseURI) {
      var data;
      $httpBackend.whenPOST(baseURI.getURI("/_sql"))
        .respond({
          "cols": ["id", "name", "hostname", "rest_url", "port", "heap", "fs", "os['cpu']", "load", "version", "os['probe_timestamp']", "process['cpu']", "os_info['available_processors']"],
          "rows": [
            ["DdKobMBdTkeTqOlwJ1pJtw", "Großhansl", "local", "0.0.0.0:4201", {
              "http": 4201,
              "psql": 5433,
              "transport": 4301
            }, {
              "used": 84798168,
              "free": 4140438824,
              "max": 4225236992,
              "probe_timestamp": 1480343364412
            }, {
              "total": {
                "bytes_written": 0,
                "size": 511023933030400,
                "available": 326811657437184,
                "reads": 0,
                "bytes_read": 0,
                "used": 183943840137216,
                "writes": 0
              },
              "disks": [{
                "bytes_written": 0,
                "dev": "path/dev",
                "size": 499046809600,
                "available": 319152009216,
                "reads": 0,
                "bytes_read": 0,
                "used": 179632656384,
                "writes": 0
              }],
              "data": [{
                "path": "path",
                "dev": "path/dev"
              }]
            }, {
              "system": 4,
              "stolen": 0,
              "used": 10,
              "idle": 91,
              "user": 6
            }, {
              "1": 2.41796875,
              "15": 2.7666015625,
              "5": 2.60498046875,
              "probe_timestamp": 1480343364412
            }, {
              "build_snapshot": true,
              "number": "0.58.0",
              "build_hash": "fec395f93f3829d658697f4f8e48c36debbc548f"
            }, 1480343364412, {
              "percent": 1,
              "user": 43856,
              "system": 16304
            }, 8],
            ["G7LLogFTSOmiSbstkufVzw", "Rinderhorn", "local", "0.0.0.0:4202", {
              "http": 4202,
              "psql": 5434,
              "transport": 4302
            }, {
              "used": 68232560,
              "free": 4157004432,
              "max": 4225236992,
              "probe_timestamp": 1480343364412
            }, {
              "total": {
                "bytes_written": 0,
                "size": 511023933030400,
                "available": 326811657437184,
                "reads": 0,
                "bytes_read": 0,
                "used": 183943840137216,
                "writes": 0
              },
              "disks": [{
                "bytes_written": 0,
                "dev": "/dev/disk1",
                "size": 499046809600,
                "available": 319152009216,
                "reads": 0,
                "bytes_read": 0,
                "used": 179632656384,
                "writes": 0
              }],
              "data": [{
                "path": "path",
                "dev": "path/dev"
              }]
            }, {
              "system": 4,
              "stolen": 0,
              "used": 10,
              "idle": 91,
              "user": 6
            }, {
              "1": 2.41796875,
              "15": 2.7666015625,
              "5": 2.60498046875,
              "probe_timestamp": 1480343364412
            }, {
              "build_snapshot": true,
              "number": "0.58.0",
              "build_hash": "fec395f93f3829d658697f4f8e48c36debbc548f"
            }, 1480343364412, {
              "percent": 1,
              "user": 44326,
              "system": 16667
            }, 8],
            ["alY3ls2jQfqgYNRIVNDtfQ", "Großstein", "local", "0.0.0.0:4200", {
              "http": 4200,
              "psql": 5432,
              "transport": 4300
            }, {
              "used": 78000760,
              "free": 4147236232,
              "max": 4225236992,
              "probe_timestamp": 1480343364412
            }, {
              "total": {
                "bytes_written": 0,
                "size": 511023933030400,
                "available": 326811657437184,
                "reads": 0,
                "bytes_read": 0,
                "used": 183943840137216,
                "writes": 0
              },
              "disks": [{
                "bytes_written": 0,
                "dev": "/dev/disk1",
                "size": 499046809600,
                "available": 319152009216,
                "reads": 0,
                "bytes_read": 0,
                "used": 179632656384,
                "writes": 0
              }],
              "data": [{
                "path": "path",
                "dev": "path/dev"
              }]
            }, {
              "system": 4,
              "stolen": 0,
              "used": 10,
              "idle": 91,
              "user": 6
            }, {
              "1": 2.41796875,
              "15": 2.7666015625,
              "5": 2.60498046875,
              "probe_timestamp": 1480343364412
            }, {
              "build_snapshot": true,
              "number": "0.58.0",
              "build_hash": "fec395f93f3829d658697f4f8e48c36debbc548f"
            }, 1480343364412, {
              "percent": 1,
              "user": 75795,
              "system": 19735
            }, 8]
          ],
          "rowcount": 3,
          "duration": 2.4111
        });

      mockNodeInfoService.executeNodeQuery().then(function(response) {
        data = response;

        expect(data).toEqual([Object({
          id: 'DdKobMBdTkeTqOlwJ1pJtw',
          name: 'Großhansl',
          hostname: 'local',
          rest_url: '0.0.0.0:4201',
          port: Object({
            http: 4201,
            psql: 5433,
            transport: 4301
          }),
          heap: Object({
            used: 84798168,
            free: 4140438824,
            max: 4225236992,
            probe_timestamp: 1480343364412
          }),
          fs: Object({
            total: Object({
              bytes_written: 0,
              size: 511023933030400,
              available: 326811657437184,
              reads: 0,
              bytes_read: 0,
              used: 183943840137216,
              writes: 0
            }),
            disks: [Object({
              bytes_written: 0,
              dev: 'path/dev',
              size: 499046809600,
              available: 319152009216,
              reads: 0,
              bytes_read: 0,
              used: 179632656384,
              writes: 0
            })],
            data: [Object({
              path: 'path',
              dev: 'path/dev'
            })]
          }),
          cpu: Object({
            system: 4,
            stolen: 0,
            used: 10,
            idle: 91,
            user: 6
          }),
          load: Object({
            1: 2.41796875,
            5: 2.60498046875,
            15: 2.7666015625,
            probe_timestamp: 1480343364412
          }),
          version: Object({
            build_snapshot: true,
            number: '0.58.0',
            build_hash: 'fec395f93f3829d658697f4f8e48c36debbc548f'
          }),
          timestamp: 1480343364412,
          proc_cpu: Object({
            percent: 1,
            user: 43856,
            system: 16304
          }),
          num_cores: 8
        }), Object({
          id: 'G7LLogFTSOmiSbstkufVzw',
          name: 'Rinderhorn',
          hostname: 'local',
          rest_url: '0.0.0.0:4202',
          port: Object({
            http: 4202,
            psql: 5434,
            transport: 4302
          }),
          heap: Object({
            used: 68232560,
            free: 4157004432,
            max: 4225236992,
            probe_timestamp: 1480343364412
          }),
          fs: Object({
            total: Object({
              bytes_written: 0,
              size: 511023933030400,
              available: 326811657437184,
              reads: 0,
              bytes_read: 0,
              used: 183943840137216,
              writes: 0
            }),
            disks: [Object({
              bytes_written: 0,
              dev: '/dev/disk1',
              size: 499046809600,
              available: 319152009216,
              reads: 0,
              bytes_read: 0,
              used: 179632656384,
              writes: 0
            })],
            data: [Object({
              path: 'path',
              dev: 'path/dev'
            })]
          }),
          cpu: Object({
            system: 4,
            stolen: 0,
            used: 10,
            idle: 91,
            user: 6
          }),
          load: Object({
            1: 2.41796875,
            5: 2.60498046875,
            15: 2.7666015625,
            probe_timestamp: 1480343364412
          }),
          version: Object({
            build_snapshot: true,
            number: '0.58.0',
            build_hash: 'fec395f93f3829d658697f4f8e48c36debbc548f'
          }),
          timestamp: 1480343364412,
          proc_cpu: Object({
            percent: 1,
            user: 44326,
            system: 16667
          }),
          num_cores: 8
        }), Object({
          id: 'alY3ls2jQfqgYNRIVNDtfQ',
          name: 'Großstein',
          hostname: 'local',
          rest_url: '0.0.0.0:4200',
          port: Object({
            http: 4200,
            psql: 5432,
            transport: 4300
          }),
          heap: Object({
            used: 78000760,
            free: 4147236232,
            max: 4225236992,
            probe_timestamp: 1480343364412
          }),
          fs: Object({
            total: Object({
              bytes_written: 0,
              size: 511023933030400,
              available: 326811657437184,
              reads: 0,
              bytes_read: 0,
              used: 183943840137216,
              writes: 0
            }),
            disks: [Object({
              bytes_written: 0,
              dev: '/dev/disk1',
              size: 499046809600,
              available: 319152009216,
              reads: 0,
              bytes_read: 0,
              used: 179632656384,
              writes: 0
            })],
            data: [Object({
              path: 'path',
              dev: 'path/dev'
            })]
          }),
          cpu: Object({
            system: 4,
            stolen: 0,
            used: 10,
            idle: 91,
            user: 6
          }),
          load: Object({
            1: 2.41796875,
            5: 2.60498046875,
            15: 2.7666015625,
            probe_timestamp: 1480343364412
          }),
          version: Object({
            build_snapshot: true,
            number: '0.58.0',
            build_hash: 'fec395f93f3829d658697f4f8e48c36debbc548f'
          }),
          timestamp: 1480343364412,
          proc_cpu: Object({
            percent: 1,
            user: 75795,
            system: 19735
          }),
          num_cores: 8
        })]);
      });
      $httpBackend.flush();
    }));
  });
});