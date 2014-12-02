'use strict';

angular.module('udc', [])
.factory('UdcSettings', function(){
  var EMAIL_KEY = 'crate.user_email';
  return {
    SegmentIoToken: 'vd4x4hv637',
    Email: {
      get: function() {
        return localStorage.getItem(EMAIL_KEY) || null;
      },
      set: function(email) {
        if (!email) return false;
        localStorage.setItem(EMAIL_KEY, email);
        return true;
      },
      unset: function() {
        localStorage.removeItem(EMAIL_KEY);
      }
    }
  };
})
.factory('Uid', function(){
  var Uid = function Uid(uid){
    this.uid = uid;
  };
  Uid.create = function(uid) {
    return new Uid(uid);
  };
  Uid.NAME = 'uid';
  Uid.prototype.isValid = function() {
    return this.uid ? this.uid.match(/^[a-f0-9]{32}$/) !== null : false;
  };
  Uid.prototype.toString = function() {
    return this.uid;
  };
  return Uid;
})
.factory('UidLoader', function($q, Uid) {
  var loadIframe = function loadIframe(uri) {
    var ifr = document.createElement('iframe');
    ifr.id = 'ifr' + new Date().getTime();
    ifr.style.width = '0px';
    ifr.style.height = '0px';
    ifr.src = uri;
    document.getElementsByTagName('body')[0].appendChild(ifr);
    return ifr;
  };

  return {
    load: function load(){
      var DOMAIN = 'cdn.crate.io';
      var PATH = '/libs/crate/uid.html';

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

      window.addEventListener('message', function(event) {
        if (event.origin.match(DOMAIN)) {
          deferred.notify(event);
          var uid = Uid.create(event.data[Uid.NAME]);
          if (uid.isValid()) {
            deferred.resolve(uid);
          } else {
            deferred.reject(new Error("Cookie failed to load"));
          }
        }
      }, false);
      var protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      loadIframe(protocol + '//' + DOMAIN + PATH);
      return promise;
    }
  };
})
