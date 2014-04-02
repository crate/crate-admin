'use strict';

var crateAdminApp = angular.module('crateAdminApp', [
  'ngRoute',
  'sql',
  'stats',
  'common',
  'overview',
  'tutorial',
  'console',
  'tables',
  'cluster'
]);

crateAdminApp.config(['$routeProvider', '$httpProvider',
  function ($routeProvider, $httpProvider) {
    // Enabling CORS in Angular JS
    $httpProvider.defaults.useXDomain = true;

    var s = window.location.search;
    var indexHtml = window.location.pathname.match(/index.html$/);
    // Check if we just got redirected.
    if (s.length) {
      s = s.substr(1);
      var parts = s.split("&");
      var search = {};
      for (var i=0; i<parts.length; i++) {
        var kv = parts[i].split("=");
        search[kv[0]] = kv[1];
      }
      if ("start_twitter" in search) {
        localStorage.setItem('crate.start_twitter', "true");
        var prefix = indexHtml ? indexHtml[0] : './'
        window.location.href = prefix + '#/tutorial';
        return;
      } else if ("base_uri" in search) {
        localStorage.setItem('crate.base_uri', search.base_uri);
        var indexHtml = window.location.pathname.match(/index.html$/);
        window.location.href = indexHtml ? indexHtml[0] : './';
        return;
      }
    }

    $routeProvider
      .when('/', {
        templateUrl: 'views/overview.html',
        controller: 'OverviewController'
      })
      .when('/tutorial', {
        templateUrl: 'views/tutorial.html',
        controller: 'TutorialController'
      })
      .when('/console', {
        templateUrl: 'views/console.html',
        controller: 'ConsoleController'
      })
      .when('/tables', {
        templateUrl: 'views/tables.html',
        controller: 'TablesController'
      })
      .when('/tables/:table_name', {
        templateUrl: 'views/tables.html',
        controller: 'TablesController'
      })
      .when('/cluster', {
        templateUrl: 'views/cluster.html',
        controller: 'ClusterController'
      })
      .when('/cluster/:node_name', {
        templateUrl: 'views/cluster.html',
        controller: 'ClusterController'
      })
      .otherwise({
        redirectTo: '/'
      });
  }]);

crateAdminApp.run(function(ClusterState) {});
