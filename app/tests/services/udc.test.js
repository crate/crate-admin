describe('UdcSettings ', function() {
  'use strict';

  var mockUdcSettings, $httpBackend, $q, SQLQuery, queryResultToObjects, baseURI;

  beforeEach(angular.mock.module('crate'));
  beforeEach(angular.mock.module('common'));
  beforeEach(angular.mock.module('udc'));
  beforeEach(angular.mock.module('sql'));

  beforeEach(function() {
    angular.mock.inject(function($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $q = $injector.get('$q');
      SQLQuery = $injector.get('SQLQuery');
      queryResultToObjects = $injector.get('queryResultToObjects');
      mockUdcSettings = $injector.get('UdcSettings');
      baseURI = $injector.get('baseURI');
    });
  });

  describe('UdcSettings Service', function() {
    it('should execute query', inject(function(ShardInfo, baseURI) {

      $httpBackend.whenPOST(baseURI.getURI("/_sql"))
        .respond({
          "cols": ["enabled", "cluster_id"],
          "rows": [
            [true, "24248621-bc52-4e7a-a6a1-ce858dfe5c73"]
          ],
          "rowcount": 1,
          "duration": 0.410422
        });
      mockUdcSettings.availability.success(function(response) {
        expect(response).toEqual({
          enabled: true,
          cluster_id: '24248621-bc52-4e7a-a6a1-ce858dfe5c73'
        });
      });
      $httpBackend.flush();
    }));

    it('should reject query', inject(function(ShardInfo, baseURI) {

      $httpBackend.whenPOST(baseURI.getURI("/_sql"))
        .respond(503, {});
      mockUdcSettings.availability.error(function(message) {
        expect(message).toEqual('Could not load udc setting');
      });
      $httpBackend.flush();
    }));


    it('should reject query', inject(function(ShardInfo, baseURI) {
      expect(mockUdcSettings.SegmentIoToken).toEqual('sfTz0KpAhR0KmOH4GnoqbpLID71eaB3w');
    }));
  });
});
describe('Uid ', function() {
  'use strict';

  var mockUid;

  beforeEach(angular.mock.module('crate'));
  beforeEach(angular.mock.module('common'));
  beforeEach(angular.mock.module('udc'));

  beforeEach(function() {
    angular.mock.inject(function($injector) {
      mockUid = $injector.get('Uid');
    });
  });

  describe('Uid Factory', function() {
    it('should create uid object', inject(function() {

      var uid_instance = mockUid.create('1234');
      expect(uid_instance.uid).toEqual('1234');
      expect(uid_instance.isValid()).toEqual(false);
      expect(uid_instance.toString()).toEqual('1234');
      expect(mockUid.NAME).toEqual('uid');
    }));
  });
});

describe('UidLoader ', function() {
  'use strict';

  var mockUidLoader;

  beforeEach(angular.mock.module('crate'));
  beforeEach(angular.mock.module('common'));
  beforeEach(angular.mock.module('udc'));

  beforeEach(function() {
    angular.mock.inject(function($injector) {
      mockUidLoader = $injector.get('UidLoader');
    });
  });

  describe('UidLoader', function() {
    it('should load uid', inject(function() {
      mockUidLoader.load();
      expect(document.getElementsByTagName('iframe')[0].src).toEqual("http://cdn.crate.io/libs/crate/uid.html");
    }));
  });
});