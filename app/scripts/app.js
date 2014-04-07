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

crateAdminApp.run(function($window, $location) {
  var url = $.url($window.location.href);
  var path = './' + url.attr("file");
  var startTwitter = url.param("start_twitter");
  var baseURI = url.param("base_uri");
  if (startTwitter) {
    localStorage.setItem('crate.start_twitter', "true");
    $window.location.href = path + '#/tutorial';
  } else if (baseURI) {
    localStorage.setItem('crate.base_uri', baseURI);
    $window.location.href = path + '#/';
  }
});
