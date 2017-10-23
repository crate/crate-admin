'use strict';

angular.module('events', [])
  .service('ClusterEventsHandler', function () {
    var listeners = {};
    var service = {};

    service.register = function register(event_name, controller_name, callback) {
      if (!listeners[event_name]) {
        listeners[event_name] = {};
      }
      listeners[event_name][controller_name] = callback;
    };

    service.trigger = function trigger(event_name) {
      for (var controller in listeners[event_name]) {
        //get callback
        var callback = listeners[event_name][controller];
        //execute callback
        callback();
      }
    };

    service.remove = function register(event_name, controller_name) {
      delete listeners[event_name][controller_name];
      if (listeners[event_name] === {}) {
        delete listeners[event_name];
      }
    };

    return service;
  });
