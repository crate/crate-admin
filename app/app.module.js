'use strict';

// for loading styles we need to load main scss file
import './styles/styles.scss';

// loading all module components
import './app.components';


var MODULES = [
  'ui.router',
  'ngCookies',
  'utils',
  'sql',
  'stats',
  'common',
  'overview',
  'feed',
  'console',
  'tables',
  'tableinfo',
  'views',
  'viewinfo',
  'shardinfo',
  'cluster',
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
    'name': 'overview',
    'url': '/',
    'templateUrl': 'static/views/overview.html'
  },
  '/console': {
    'name': 'console',
    'url': '/console',
    'templateUrl': 'static/views/console.html'
  },
  '/tables': {
    'name': 'tables',
    'url': '/tables',
    'template': '<tables>',
  },
  '/tables/:table_schema/:table_name': {
    'name': 'tables.table',
    'url': '/:table_schema/:table_name',
    'template': '<table-detail>',
  },
  '/views': {
    'name': 'views',
    'url': '/views',
    'template': '<views>',
  },
  '/views/:schema/:name': {
    'name': 'views.view',
    'url': '/:schema/:name',
    'template': '<view-detail>',
  },
  '/nodes': {
    'name': 'nodes',
    'url': '/nodes',
    'template': '<cluster>',
  },
  '/nodes/:node_id': {
    'name': 'nodes.node',
    'url': '/:node_id',
    'template': '<node-detail>',
  },
  '/401': {
    'name': 'unauthorized',
    'url': '/401',
    'templateUrl': 'static/views/401.html'
  }
};

// this is required for the test setup!
var appModule = angular.module('crate', MODULES);

var head = document.getElementsByTagName('head')[0];

var loadScript = function (url) {
  var result = $.Deferred();
  var script = document.createElement('script');
  script.async = 'async';
  script.type = 'text/javascript';
  script.src = url;
  script.onload = function () {
    result.resolve();
  };
  script.onerror = function () {
    result.reject();
  };
  head.appendChild(script);
  return result.promise();
};

var loadStylesheet = function (url) {
  var result = $.Deferred();
  var link = document.createElement('link');
  link.async = 'async';
  link.type = 'text/css';
  link.rel = 'stylesheet';
  link.href = url;
  link.onload = function () {
    result.resolve();
  };
  link.onerror = function () {
    result.reject();
  };
  head.appendChild(link);
  return result.promise();
};

// todo: load json from rest endpoint
$.get('static/conf/plugins.json', function (plugins) {

  ENTERPRISE_PLUGINS = plugins.filter(function (p) {
    return p.enterprise;
  }).map(function (el) {
    return {
      name: el.name,
      files: [el.uri],
      routing: el.routing,
      stylesheet: el.stylesheet
    };
  });
  DEFAULT_PLUGINS = plugins.filter(function (p) {
    return !p.enterprise;
  });

  //function to create 'crate' module and bootstrap app
  var loadApp = function () {
    appModule = angular.module('crate', MODULES);
    appModule.config(['SQLQueryProvider', 'queryResultToObjectsProvider', '$ocLazyLoadProvider', '$stateProvider',
      'SettingsProvider',
      function (SQLQueryProvider, queryResultToObjectsProvider, $ocLazyLoadProvider,
        $stateProvider, SettingsProvider) {

        if (SettingsProvider.$get().enterprise === true) {
          loadStylesheet('static/styles/enterprise.css');
        }
        var stmt = `
          SELECT
            license['issued_to'] as issued_to,
            license['expiry_date'] as expiry_date,
            license['max_nodes'] as max_nodes
          FROM
            sys.cluster
        `;
        SQLQueryProvider.$get().execute(stmt, {}, false, false, false)
          .then(function (query) {
            let result = queryResultToObjectsProvider.$get()(
              query,
              ['issued_to', 'expiry_date', 'max_nodes']
            )[0];
            SettingsProvider.setEnterprise(result.issued_to != null);
            SettingsProvider.setLicenseIssuedTo(result.issued_to);
            SettingsProvider.setLicenseExpiryDate(result.expiry_date);
            SettingsProvider.setLicenseMaxNodes(result.max_nodes);
            if (SettingsProvider.$get().enterprise) {
              loadStylesheet('static/styles/enterprise.css');
              $ocLazyLoadProvider.config({
                modules: ENTERPRISE_PLUGINS,
                events: true
              });

              $ocLazyLoadProvider.$get().load(ENTERPRISE_PLUGINS);

              for (var i = 0; i < ENTERPRISE_PLUGINS.length; i++) {
                loadStylesheet(ENTERPRISE_PLUGINS[i].stylesheet);
                var routing = ENTERPRISE_PLUGINS[i].routing;
                if (routing) {
                  for (var pattern in routing) {
                    $stateProvider.state(routing[pattern]);
                  }
                }
              }
              console.info('Loaded Enterprise Plugins:', ENTERPRISE_PLUGINS.map(function (o) {
                return o.name;
              }));
            }
          }, function () {
            SettingsProvider.setEnterprise(false);
            console.info('Failed to load Enterprise settings');
          });
      }
    ]);

    appModule.config(['$stateProvider', '$httpProvider', '$urlMatcherFactoryProvider', '$urlRouterProvider',
      function ($stateProvider, $httpProvider, $urlMatcherFactoryProvider, $urlRouterProvider) {
        $urlMatcherFactoryProvider.strictMode(false);
        // Enabling CORS in Angular JS
        $httpProvider.defaults.useXDomain = true;
        // register default routing
        var pattern;
        for (pattern in ROUTING) {
          $stateProvider.state(ROUTING[pattern]);
        }
        // register routing from plugins
        for (var i = 0; i < DEFAULT_PLUGINS.length; i++) {
          var routing = DEFAULT_PLUGINS[i].routing;
          if (routing) {
            for (pattern in routing) {
              $stateProvider.state(routing[pattern]);
            }
          }
        }
        $urlRouterProvider
          .otherwise('/');
      }
    ]);

    appModule.config(function($sceDelegateProvider) {
      $sceDelegateProvider.resourceUrlWhitelist(['**']);
    });
    // Configuration of i18n Internationalization
    appModule.config(['$translateProvider', '$translatePartialLoaderProvider',
      function ($translateProvider, $translatePartialLoaderProvider) {

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

    appModule.run(function ($rootScope, $translate) {
      $rootScope.$on('$translatePartialLoaderStructureChanged', function () {
        $translate.refresh();
      });
    });

    appModule.run(function ($rootScope) {
      $rootScope.$on('showSideNav', function () {
        $rootScope.showSideNav = true;
        $rootScope.showSideList = true;
      });

      $rootScope.$on('hideSideNav', function () {
        $rootScope.showSideNav = false;
        $rootScope.showSideList = false;
      });
    });

    angular.element(document).ready(function () {
      angular.bootstrap(document, ['crate']);
    });

  };

  var promises = [];
  for (var i = 0; i < DEFAULT_PLUGINS.length; i++) {
    promises.push(loadScript(DEFAULT_PLUGINS[i].uri));
    if (DEFAULT_PLUGINS[i].stylesheet) {
      promises.push(loadStylesheet(DEFAULT_PLUGINS[i].stylesheet));
    }
  }

  $.when.apply($, promises).then(function () {
    console.info('Loaded Modules:', MODULES);
    console.info('Default Plugins:', DEFAULT_PLUGINS.map(function (el) {
      return el.name;
    }));

    //onSucess: update the modules and load the app
    MODULES = MODULES.concat(DEFAULT_PLUGINS.map(function (el) {
      return el.name;
    }));
    loadApp();
  }, function () {
    //onError: load the app without the plugins
    console.info('Loaded Modules:', MODULES);
    console.warn('Plugins could not be loaded. Please check your config file: plugins.json');
    loadApp();
  });

});


export default appModule;
