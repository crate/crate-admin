'use strict';

(function() {

  var MODULES = [
    'ngRoute',
    'truncate',
    'sql',
    'stats',
    'common',
    'overview',
    'feed',
    'tutorial',
    'console',
    'tables',
    'cluster',
    'tableinfo',
    'shardinfo',
    'nodeinfo',
    'udc',
    'nvd3ChartDirectives'
  ];

  var ROUTING = {
    '/': {
      'templateUrl': 'views/overview.html',
      'controller': 'OverviewController'
    },
    '/tutorial': {
      'templateUrl': 'views/tutorial.html',
      'controller': 'TutorialController'
    },
    '/console': {
      'templateUrl': 'views/console.html',
      'controller': 'ConsoleController'
    },
    '/tables': {
      'templateUrl': 'views/tables.html',
      'controller': 'TableDetailController'
    },
    '/tables/:schema_name/:table_name': {
      'templateUrl': 'views/tables.html',
      'controller': 'TableDetailController'
    },
    '/cluster': {
      'templateUrl': 'views/node.html',
      'controller': 'NodeDetailController'
    },
    '/nodes/:node_name': {
      'templateUrl': 'views/node.html',
      'controller': 'NodeDetailController'
    }
  };

  var head = document.getElementsByTagName('head')[0];

  var loadScript = function loadScript(url) {
    var script = document.createElement('script');
    script.type = 'application/javascript';
    script.src = url;
    head.appendChild(script);
  };

  // todo: load json from rest endpoint
  $.get("conf/plugins.json", function(plugins){

    console.info("Loaded Modules:", MODULES);
    console.info("Loaded Plugins:", plugins.map(function(o){ return o.name; }));
    
    for (var i=0; i<plugins.length; i++) {
      var module = plugins[i];
      loadScript(module.uri);
      MODULES.push(module.name);
    }

    var app = angular.module('crate', MODULES);

    app.config(['$routeProvider', '$httpProvider',
      function ($routeProvider, $httpProvider) {
        // Enabling CORS in Angular JS
        $httpProvider.defaults.useXDomain = true;
        // register default routing
        for (var pattern in ROUTING) {
          $routeProvider.when(pattern, ROUTING[pattern]);
        }
        // register routing from plugins
        for (var i=0; i<plugins.length; i++) {
          var routing = plugins[i].routing;
          if (routing) {
            for (var pattern in routing) {
              $routeProvider.when(pattern, routing[pattern]);
            }
          }
        }
        // register default redirect to '/' if URL not found
        $routeProvider.otherwise({
            redirectTo: '/'
          });
      }]);

    app.run(function($window, $location) {
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

    angular.element(document).ready(function() {
      angular.bootstrap(document, ['crate']);
    });

  });

}());

