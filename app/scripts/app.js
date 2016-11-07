'use strict';



var MODULES = [
  'ngRoute',
  'ngCookies',
  'truncate',
  'sql',
  'stats',
  'common',
  'overview',
  'feed',
  'console',
  'tables',
  'cluster',
  'tableinfo',
  'shardinfo',
  'nodeinfo',
  'checks',
  'udc',
  'translation',
  'nvd3ChartDirectives',
  'pascalprecht.translate'
];

var app = angular.module('crate', MODULES);

var ROUTING = {
  '/': {
    'templateUrl': 'views/overview.html',
    'controller': 'OverviewController'
  },
  '/console': {
    'templateUrl': 'views/console.html',
    'controller': 'ConsoleController'
  },
  '/tables': {
    'templateUrl': 'views/tables.html',
    'controller': 'TableDetailController'
  },
  '/tables/:table_schema/:table_name': {
    'templateUrl': 'views/tables.html',
    'controller': 'TableDetailController'
  },
  '/nodes': {
    'templateUrl': 'views/node.html',
    'controller': 'NodeDetailController'
  },
  '/nodes/:node_id': {
    'templateUrl': 'views/node.html',
    'controller': 'NodeDetailController'
  }
};

var head = document.getElementsByTagName('head')[0];

var loadScript = function loadScript(url) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, false);
  xhr.send('');
  var script = document.createElement('script');
  script.type = 'application/javascript';
  script.text = xhr.responseText;
  head.appendChild(script);
};

// todo: load json from rest endpoint
$.get("conf/plugins.json", function(plugins) {

  console.info("Loaded Modules:", MODULES);
  console.info("Loaded Plugins:", plugins.map(function(o) {
    return o.name;
  }));

  for (var i = 0; i < plugins.length; i++) {
    var module = plugins[i];
    loadScript(module.uri);
    MODULES.push(module.name);
  }

  app = angular.module('crate', MODULES);

  app.config(['$routeProvider', '$httpProvider',
    function($routeProvider, $httpProvider) {
      // Enabling CORS in Angular JS
      $httpProvider.defaults.useXDomain = true;
      // register default routing
      for (var pattern in ROUTING) {
        $routeProvider.when(pattern, ROUTING[pattern]);
      }
      // register routing from plugins
      for (var i = 0; i < plugins.length; i++) {
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
    }
  ]);

  // Configuration of i18n Internationalization
  app.config(['$translateProvider', '$translatePartialLoaderProvider',
    function($translateProvider, $translatePartialLoaderProvider) {

      // add main translation part
      $translatePartialLoaderProvider.addPart('.');
      // configures partialLoader
      $translateProvider.useLoader('$translatePartialLoader', {
        urlTemplate: '{part}/i18n/{lang}.json'
      })

      .registerAvailableLanguageKeys(['en', 'de', 'es'], {
          'en_*': 'en',
          'de_*': 'de',
          'es_*': 'es',
          '*': 'en'
        })
        // Check local language automatically
        .determinePreferredLanguage()
        // Use English as default language if no matched language is found.
        .fallbackLanguage('en')

      .useSanitizeValueStrategy(null);
      // remember language
      $translateProvider.useCookieStorage();
    }
  ]);

  app.run(function($rootScope, $translate) {
    $rootScope.$on('$translatePartialLoaderStructureChanged', function() {
      $translate.refresh();
    });
  });

  app.run(function($window, $location) {
    var baseURI = $location.search().base_uri;
    if (baseURI) {
      localStorage.setItem('crate.base_uri', baseURI);
    }
  });

  angular.element(document).ready(function() {
    angular.bootstrap(document, ['crate']);
  });

});