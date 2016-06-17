'use strict';

angular.module('udc', [])
.factory('UdcSettings', ['SQLQuery', 'queryResultToObjects', '$q',
  function(SQLQuery, queryResultToObjects, $q){
    var deferred = $q.defer();
    var promise = deferred.promise;
    promise.success = (result) => {
      promise.then(result, null, null);
      return promise;
    };
    promise.error = (error) => {
      promise.then(null, error, null);
      return promise;
    };

    const stmt = "SELECT settings['udc']['enabled'] as enabled, id as cluster_id from sys.cluster";
    const cols = ['enabled', 'cluster_id'];

    SQLQuery.execute(stmt)
      .success((query) => {
        let result = queryResultToObjects(query, cols);
        deferred.resolve(result[0]);
      })
      .error((query) => {
        deferred.reject(null, "could not load udc setting");
      });

    return {
      SegmentIoToken: 'sfTz0KpAhR0KmOH4GnoqbpLID71eaB3w',
      availability: promise
    };
  }
])
.factory('Uid', [
  function(){
    class Uid {
      constructor(uid) {
        this.uid = uid;
      }
      isValid() {
        return this.uid ? this.uid.match(/^[a-f0-9]{32}$/) !== null : false;
      }
      toString() {
        return this.uid;
      }
      static create(uid) {
        return new Uid(uid);
      }
    }
    return Uid;
  }
])
.factory('UidLoader', [
  function($q, Uid) {
    var cachedUid = null;
    var loadIframe = (uri) => {
      var ifr = document.createElement('iframe');
      ifr.id = 'ifr' + new Date().getTime();
      ifr.style.width = '0px';
      ifr.style.height = '0px';
      ifr.src = uri;
      document.getElementsByTagName('body')[0].appendChild(ifr);
      return ifr;
    };

    const DOMAIN = 'cdn.crate.io';
    const PATH = '/libs/crate/uid.html';

    return {
      load: () => {
        var deferred = $q.defer();
        var promise = deferred.promise;
        promise.success = (fn) => {
          promise.then(fn, null, null);
          return promise;
        };
        promise.error = (fn) => {
          promise.then(null, fn, null);
          return promise;
        };
        promise.notify = (fn) => {
          promise.then(null, null, fn);
          return promise;
        };

        if (cachedUid === null) {
            window.addEventListener('message', (event) => {
              if (event.origin.match(DOMAIN)) {
                deferred.notify(event);
                let uid = Uid.create(event.data['uid']);
                if (uid.isValid()) {
                  cachedUid = uid;
                  deferred.resolve(uid);
                } else {
                  deferred.reject(new Error("Cookie failed to load"));
                }
              }
            }, false);
            loadIframe('https://' + DOMAIN + PATH);
        } else {
          deferred.resolve(cachedUid);
        }
        return promise;
      }
    }
  }
]);

