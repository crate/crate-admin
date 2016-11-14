'use strict';

var commons = angular.module('common', ['stats', 'udc'])
  .controller('StatusBarController', function($scope, $rootScope, $log, $location, $translate, $sce, ClusterState, ChecksService) {
    var HEALTH = ['good', 'warning', 'critical', '--'];
    var LABELS = ['cr-bubble--success', 'cr-bubble--warning', 'cr-bubble--danger', 'cr-bubble--danger'];
    var colorMap = HEALTH.reduce(function(memo, o, idx) {
      memo[o] = LABELS[idx];
      return memo;
    }, {});

    var DOCS_BASE_URL = 'https://crate.io/docs';
    var getDocsUrl = function getDocsUrl(version) {
      return $sce.trustAsResourceUrl(DOCS_BASE_URL + (version ? '/en/' + version.number : '/stable') + '/');
    };
    $scope.cluster_color_label = '';
    $scope.config_label = '';

    var showSideNav = false;
    $scope.toggleSideNav = function(){
      showSideNav = !showSideNav;
      if (showSideNav){
        $rootScope.$broadcast('showSideNav');
      }else{
        $rootScope.$broadcast('hideSideNav');
      }
    };

    $scope.showSettings = false;
    $scope.toggleSettings = function(){
      $scope.showSettings = !$scope.showSettings;
    };

    $scope.$watch(function() {
      return ChecksService;
    }, function(data) {
      if (data.success === true) {
        var checks = [];
        checks.push.apply(checks, data.checks.cluster_checks);
        checks.push.apply(checks, data.checks.node_checks);
        var severity = checks.reduce(function(memo, obj, idx) {
          return Math.max(memo, obj.severity);
        }, 1);
        $translate(['STATUSBAR.CHECK', 'STATUSBAR.CHECKS', 'STATUSBAR.FAILED']).then(function(i18n) {
          $scope.checks_message = $sce.trustAsHtml([checks.length, checks.length == 1 ? i18n['STATUSBAR.CHECK'] : i18n['STATUSBAR.CHECKS'], i18n['STATUSBAR.FAILED']].join("\u00A0"));
          $scope.config_label = LABELS[Math.min(severity - 1, LABELS.length - 1)];
        });
      } else {
        $translate(['STATUSBAR.OFFLINE']).then(function(i18n) {
          $scope.checks_message = $sce.trustAsHtml(i18n['STATUSBAR.CLUSTER_OFFLINE']);
        });
        $scope.config_label = '';
      }
    }, true);

    $scope.$watch(function() {
      return ClusterState.data;
    }, function(data) {
      var hashes = [];
      var versions = data.cluster.filter(function(obj, idx) {
        var contains = false;
        if (obj.version) {
          var hash = obj.version.build_hash;
          contains = hashes.indexOf(hash) == -1;
          hashes.push(hash);
        }
        return contains;
      }).map(function(obj, idx) {
        return obj.version.number;
      });
      $scope.versions = versions;
      $scope.version_warning = versions.length > 1;
      $scope.cluster_state = data.status;
      $scope.cluster_name = data.name;
      $scope.num_nodes = data.cluster.length;
      $scope.load1 = data.load[0] == '-.-' ? data.load[0] : data.load[0].toFixed(2);
      $scope.load5 = data.load[1] == '-.-' ? data.load[1] : data.load[1].toFixed(2);
      $scope.load15 = data.load[2] == '-.-' ? data.load[2] : data.load[2].toFixed(2);
      $scope.version = data.version;
      $scope.docs_url = getDocsUrl(data.version);
      $scope.cluster_color_label = data.online ? colorMap[data.status] : '';
    }, true);

    // bind tooltips
    $("[rel=tooltip]").tooltip({
      placement: 'bottom'
    });
  })
  .controller('NavigationController', function($scope, $rootScope, $location, NavigationService) {

    $scope.navBarElements = NavigationService.navBarElements;
    $scope.showSideNav = false;

    $(".cr-side-nav-item").tooltip({
      placement: 'right'
    });

    $rootScope.$on("showSideNav", function() {
      $scope.showSideNav = true;
      });

    $rootScope.$on("hideSideNav", function() {
      $scope.showSideNav = false;
      });

    $scope.goToPath = function(path) {
      $location.path(path);
    };

    $scope.isActive = function(viewLocation) {
      if (viewLocation == '/') {
        return viewLocation === $location.path();
      } else {
        return $location.path().substr(0, viewLocation.length) == viewLocation;
      }
    };
  })
  .service('NavigationService', function() {
    var navBarElements = [];

    var navigationService = {
      addNavBarElement: addNavBarElement,
      updateNavBarElement: updateNavBarElement,
      navBarElements: navBarElements
    };

    return navigationService;

    ////

    function addNavBarElement(iconClass, text, urlPattern, index) {
      if (urlPattern.charAt(0) != '/') {
        urlPattern = "/" + urlPattern;
      }

      var pluginElement = {
        "text": text,
        "iconSrc": iconClass,
        "urlPattern": urlPattern
      };

      if (typeof index === 'undefined') {
        navBarElements.push(pluginElement);
      } else if (index < 0 || index >= navBarElements.length) {
        navBarElements.push(pluginElement);
      } else {
        navBarElements.splice(index, 0, pluginElement);
      }
    }
    // urlPattern is the identifier. TODO: need an actual identifier for each element
    function updateNavBarElement(urlPattern, text) {

      if (urlPattern.charAt(0) != '/') {
        urlPattern = "/" + urlPattern;
      }

      var queryElements = navBarElements.filter(function(item) {
        return item.urlPattern == urlPattern;
      });

      if (queryElements.length === 0) {
        return;
      }

      queryElements[0].text = text;
    }

  })
  .directive('focus', function($timeout) {
    return {
      scope: {
        trigger: '@focus'
      },
      link: function(scope, element) {
        scope.$watch('trigger', function(value) {
          if (value) {
            $timeout(function() {
              element[0].focus();
            });
          }
        });
      }
    };
  })
  .directive('fixBottom', function() {
    return function(scope, element, attr) {
      var elem = $(element),
        nav = $('.side-nav .navbar-nav'),
        win = $(window);
      var calculate = function calculate() {
        scope.fixBottom = (nav.offset().top + nav.height() + elem.height() < win.height());
      };
      win.on("resize", calculate);
      calculate();
    };
  })
  .controller('HelpMenuController', function($scope, UidLoader, UdcSettings) {
    var verified = null;

    // set user
    $scope.user = {
      uid: null
    };

    // 'analytics' is globally available
    analytics.load(UdcSettings.SegmentIoToken)
    analytics.ready(function() {
      var user = analytics.user();
      verified = {
        id: user.id(),
        traits: user.traits()
      };
    });

    var identify = function identify(userdata) {
      if (userdata.user.uid != null) {
        analytics.setAnonymousId(userdata.user.uid);
        analytics.identify(userdata.user.uid);
        analytics.page();
        analytics.track('visited_admin', {
          'version': $scope.version.number,
          'cluster_id': userdata.cluster_id
        });
      }
    };

    UdcSettings.availability.success(function(data) {
      if (data.enabled === true) {
        // load uid
        UidLoader.load().success(function(uid) {
          $scope.user.uid = uid.toString();
          identify({
            'user': $scope.user,
            'cluster_id': data.cluster_id
          });
        }).error(function(error) {
          console.warn(error);
        });
      }
    });
  })
  .controller('LanguageSwitchController', function($scope, $translate) {
    $scope.showDropDown = false;
    $scope.toggleDropDown = function(){
      $scope.showDropDown = !$scope.showDropDown;
    };

    $scope.selectedLanguage = "auto";

    $scope.changeLanguage = function(langKey) {
      // Check if AutoDetect is chosen, if yes, set langKey as preferredLanguage.
      langKey = langKey === 'auto' ? $translate.preferredLanguage() : langKey;
      $translate.use(langKey);
      $scope.selectedLanguage = langKey;
      $scope.toggleDropDown();
    };
  });


commons.run(function(NavigationService, $translate, $filter, $rootScope) {
  // Initial translation of navigation bar items
  NavigationService.addNavBarElement("images/icons/icon-overview.svg", $filter('translate', 'NAVIGATION.OVERVIEW'), "/");
  NavigationService.addNavBarElement("images/icons/icon-console.svg", $filter('translate', 'NAVIGATION.CONSOLE'), "/console");
  NavigationService.addNavBarElement("images/icons/icon-table.svg", $filter('translate', 'NAVIGATION.TABLE'), "/tables");
  NavigationService.addNavBarElement("images/icons/icon-cluster.svg", $filter('translate', 'NAVIGATION.CLUSTER'), "/nodes");


  // Update Navbar Elements if Language is Changed
  $rootScope.$on('$translateChangeSuccess', function() {
    $translate(['NAVIGATION.OVERVIEW', 'NAVIGATION.CONSOLE', 'NAVIGATION.TABLE', 'NAVIGATION.CLUSTER']).then(function(i18n) {
      NavigationService.updateNavBarElement("/", i18n['NAVIGATION.OVERVIEW']);
      NavigationService.updateNavBarElement("/console", i18n['NAVIGATION.CONSOLE']);
      NavigationService.updateNavBarElement("/tables", i18n['NAVIGATION.TABLE']);
      NavigationService.updateNavBarElement("/nodes", i18n['NAVIGATION.CLUSTER']);
    });
  });
});