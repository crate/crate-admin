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
  'datatypechecks',
  'nvd3',
  'pascalprecht.translate',
  'oc.lazyLoad'
];

var DEFAULT_PLUGINS = [];
var ENTERPRISE_PLUGINS = [];

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

// this is required for the test setup!
var app = angular.module('crate', MODULES);

var head = document.getElementsByTagName('head')[0];

var loadScript = function(url) {
  var result = $.Deferred();
  var script = document.createElement('script');
  script.async = 'async';
  script.type = 'text/javascript';
  script.src = url;
  script.onload = function() {
    result.resolve();
  };
  script.onerror = function() {
    result.reject();
  };
  head.appendChild(script);
  return result.promise();
};

var loadStylesheet = function(url) {
  var result = $.Deferred();
  var link = document.createElement('link');
  link.async = 'async';
  link.type = 'text/css';
  link.rel = 'stylesheet';
  link.href = url;
  link.onload = function() {
    result.resolve();
  };
  link.onerror = function() {
    result.reject();
  };
  head.appendChild(link);
  return result.promise();
};

// todo: load json from rest endpoint
$.get('conf/plugins.json', function(plugins) {

  ENTERPRISE_PLUGINS = plugins.filter(function(p) {
    return p.enterprise;
  }).map(function(el) {
    return {
      name: el.name,
      files: [el.uri],
      routing: el.routing
    };
  });
  DEFAULT_PLUGINS = plugins.filter(function(p) {
    return !p.enterprise;
  });

  //function to create 'crate' module and bootstrap app
  var loadApp = function() {
    app = angular.module('crate', MODULES);
    app.config(['SQLQueryProvider', 'queryResultToObjectsProvider', '$ocLazyLoadProvider', '$routeProvider',
      function(SQLQueryProvider, queryResultToObjectsProvider, $ocLazyLoadProvider, $routeProvider) {

        var stmt = 'SELECT settings[\'license\'][\'enterprise\'] as enterprise ' +
          'FROM sys.cluster';

        SQLQueryProvider.$get().execute(stmt)
          .success(function(query) {
            var result = queryResultToObjectsProvider.$get()(query, ['enterprise']);
            if (result[0].enterprise) {
              loadStylesheet('static/styles/main-enterprise.css');

              $ocLazyLoadProvider.config({
                modules: ENTERPRISE_PLUGINS,
                events: true
              });
              for (var i = 0; i < ENTERPRISE_PLUGINS.length; i++) {
                $ocLazyLoadProvider.$get().load(ENTERPRISE_PLUGINS[i].name);

                var routing = ENTERPRISE_PLUGINS[i].routing;
                if (routing) {
                  for (var pattern in routing) {
                    $routeProvider.when(pattern, routing[pattern]);
                  }
                }
              }
              console.info('Loaded Enterprise Plugins:', ENTERPRISE_PLUGINS.map(function(o) {
                return o.name;
              }));
            }
          }).error(function() {
            console.info('Failed to load Enterprise settings');
          });
      }
    ]);

    app.config(['$routeProvider', '$httpProvider',
      function($routeProvider, $httpProvider) {
        // Enabling CORS in Angular JS
        $httpProvider.defaults.useXDomain = true;
        // register default routing
        var pattern;
        for (pattern in ROUTING) {
          $routeProvider.when(pattern, ROUTING[pattern]);
        }
        // register routing from plugins
        for (var i = 0; i < plugins.length; i++) {
          var routing = plugins[i].routing;
          if (routing && !plugins[i].enterprise) {
            for (pattern in routing) {
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
          urlTemplate: '{part}/static/i18n/{lang}.json'
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

    app.run(function($rootScope) {
      $rootScope.$on('showSideNav', function() {
        $rootScope.showSideNav = true;
      });

      $rootScope.$on('hideSideNav', function() {
        $rootScope.showSideNav = false;
      });
    });

    app.run(function($rootScope) {
      $rootScope.$on('showSideNav', function() {
        $rootScope.showSideNav = true;
        $rootScope.showTableList = true;
        $rootScope.showNodeList = true;
      });

      $rootScope.$on('hideSideNav', function() {
        $rootScope.showSideNav = false;
        $rootScope.showTableList = false;
        $rootScope.showNodeList = false;
      });
    });

    angular.element(document).ready(function() {
      angular.bootstrap(document, ['crate']);
    });

  };

  var promises = [];
  for (var i = 0; i < plugins.length; i++) {
    if (!plugins[i].enterprise) {
      promises.push(loadScript(plugins[i].uri));
    }
    if (plugins[i].stylesheet) {
      promises.push(loadStylesheet(plugins[i].stylesheet));
    }
  }

  $.when.apply($, promises).then(function() {
    console.info('Loaded Modules:', MODULES);
    console.info('Default Plugins:', DEFAULT_PLUGINS);

    //onSucess: update the modules and load the app
    MODULES.push(...DEFAULT_PLUGINS.map(function(el) {
      return el.name;
    }));
    loadApp();
  }, function() {
    //onError: load the app without the plugins
    console.info('Loaded Modules:', MODULES);
    console.warn('Plugins could not be loaded. Please check your config file: plugins.json');
    loadApp();
  });

});