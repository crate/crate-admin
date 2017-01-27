'use strict';

angular.module('udc', [])
  .factory('UdcSettings', function(SQLQuery, queryResultToObjects, $q){
    var deferred = $q.defer();
    var promise = deferred.promise;
    promise.success = function(result) {
      promise.then(result, null, null);
      return promise;
    };
    promise.error = function(error) {
      promise.then(null, error, null);
      return promise;
    };

    var stmt = 'SELECT settings[\'udc\'][\'enabled\'] as enabled, id AS cluster_id ' +
      'FROM sys.cluster';
    SQLQuery.execute(stmt)
      .success(function(query) {
        var result = queryResultToObjects(query, ['enabled','cluster_id']);
        deferred.resolve(result[0]);
      }).error(function() {
        deferred.reject('Could not load udc setting');
      });

    return {
      SegmentIoToken: 'sfTz0KpAhR0KmOH4GnoqbpLID71eaB3w',
      availability: promise
    };
  })
  .factory('Uid', function() {
    var Uid = function(uid) {
      this.uid = uid;
    };
    Uid.create = function(uid) {
      return new Uid(uid);
    };
    Uid.prototype.isValid = function() {
      return this.uid ? this.uid.match(/^[a-f0-9]{32}$/) !== null : false;
    };
    Uid.prototype.toString = function() {
      return this.uid;
    };
    Uid.NAME = 'uid';
    return Uid;
  })
  .factory('UidLoader', function($q, Uid) {
    var cachedUid = null;
    var loadIframe = function(uri) {
      var ifr = document.createElement('iframe');
      ifr.id = 'ifr' + new Date().getTime();
      ifr.style.width = '0px';
      ifr.style.height = '0px';
      ifr.src = uri;
      document.getElementsByTagName('body')[0].appendChild(ifr);
      return ifr;
    };

    var DOMAIN = 'cdn.crate.io';
    var PATH = '/libs/crate/uid.html';

    return {
      load: function() {
        var deferred = $q.defer();
        var promise = deferred.promise;
        promise.success = function(fn) {
          promise.then(fn, null, null);
          return promise;
        };
        promise.error = function(fn) {
          promise.then(null, fn, null);
          return promise;
        };
        promise.notify = function(fn) {
          promise.then(null, null, fn);
          return promise;
        };

        if (cachedUid === null) {
          window.addEventListener('message', function(event) {
            if (event.origin.match(DOMAIN)) {
              deferred.notify(event);
              var uid = Uid.create(event.data[Uid.NAME]);
              if (uid.isValid()) {
                cachedUid = uid;
                deferred.resolve(uid);
              } else {
                deferred.reject(new Error('Cookie failed to load'));
              }
            }
          }, false);
          var protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
          loadIframe(protocol + '//' + DOMAIN + PATH);
        } else {
          deferred.resolve(cachedUid);
        }
        return promise;
      }
    };
  });
