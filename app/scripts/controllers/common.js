'use strict';

const commons = angular.module('common', ['stats', 'udc', 'events', 'sql'])
  .provider('Settings', function () {
    var enterprise;
    var ident = '';
    var user = '';
    if (localStorage.getItem('crate_setting_enterprise')) {
      enterprise = localStorage.getItem('crate_setting_enterprise');
    } else {
      enterprise = false;
    }

    return {
      setEnterprise: function(value) {
        enterprise = value;
        try {
          localStorage.setItem('crate_setting_enterprise', value);
        } catch (error) {
          console.log('localStorage cannot be set in Safari private mode', error);
        }
      },
      setIdent: function(value) {
        ident = value;
      },
      setUser: function(value) {
        user = value;
      },
      $get: function() {
        return {
          enterprise: enterprise,
          ident: ident,
          user: user
        };
      }
    };
  })
  .controller('UnauthorizedCtrl', [function () {}])
  .controller('StatusBarController', function ($scope, $rootScope, $log, $location, $translate, $sce, $window,
    ClusterState, ChecksService, UidLoader, UdcSettings, Settings, Clipboard, ClusterEventsHandler,
    SQLQuery, queryResultToObjects) {

    //query for current_user only in enterprise edition
    if (Settings.enterprise) {
      var userStmt = 'SELECT CURRENT_USER';
      SQLQuery.execute(userStmt, {}, false, false, false)
        .then(function(query) {
          var result = queryResultToObjects(query, ['user']);
          Settings.user = result[0].user;
          $scope.userName = Settings.user;
        });
    }

    var HEALTH = ['good', 'warning', 'critical', '--'];
    var LABELS = ['cr-bubble--success', 'cr-bubble--warning', 'cr-bubble--danger', 'cr-bubble--danger'];
    var colorMap = HEALTH.reduce(function(memo, o, idx) {
      memo[o] = LABELS[idx];
      return memo;
    }, {});

    var DOCS_BASE_URL = 'https://crate.io/docs';
    var getMajorMinorVersion = function getMajorMinorVersion(version) {
      var SHORT_VERSION_RE = new RegExp(/(\d+\.\d+)\.\d+.*/);
      return version ? version.number.match(SHORT_VERSION_RE)[1] : null;
    };
    var getDocsUrl = function getDocsUrl(version) {
      return $sce.trustAsResourceUrl(DOCS_BASE_URL + (version ? '/en/' + version : '/stable') + '/');
    };
    $scope.cluster_color_label = '';
    $scope.config_label = '';

    $scope.goToPath = function(path) {
      $location.path(path).search('user=' + Settings.user);
    };
    var showSideNav = false;

    $scope.enterprise = Settings.enterprise;
    $scope.licenseIdent = Settings.ident;

    $scope.toggleSideNav = function() {
      showSideNav = !showSideNav;
      if (showSideNav) {
        $rootScope.$broadcast('showSideNav');
      } else {
        $rootScope.$broadcast('hideSideNav');
      }
    };

    $scope.copy = function(text) {
      Clipboard.copy(text);
    };

    $scope.showSettings = false;
    $scope.toggleSettings = function() {
      $scope.showSettings = !$scope.showSettings;
    };


    var updateClusterChecks = function () {
      if (ChecksService.success === true) {
        var checks = [];
        checks.push.apply(checks, ChecksService.checks.cluster_checks);
        checks.push.apply(checks, ChecksService.checks.node_checks);
        var severity = checks.reduce(function (memo, obj) {
          return Math.max(memo, obj.severity);
        }, 1);
        $translate(['STATUSBAR.CHECK', 'STATUSBAR.CHECKS', 'STATUSBAR.FAILED']).then(function (i18n) {
          $scope.checks_message = $sce.trustAsHtml([checks.length, checks.length == 1 ? i18n['STATUSBAR.CHECK'] : i18n['STATUSBAR.CHECKS'], i18n['STATUSBAR.FAILED']].join('\u00A0'));
          $scope.config_label = LABELS[Math.min(severity - 1, LABELS.length - 1)];
        });
      } else {
        $translate(['STATUSBAR.CLUSTER_OFFLINE']).then(function (i18n) {
          $scope.checks_message = $sce.trustAsHtml(i18n['STATUSBAR.CLUSTER_OFFLINE']);
        });
        $scope.config_label = '';
      }
    };

    ClusterEventsHandler.register('CHECKS_REFRESHED', 'StatusBarController', updateClusterChecks);
    updateClusterChecks();

    var updateClusterInfo = function() {
      var hashes = [];
      var versions = ClusterState.data.cluster.filter(function (obj) {
        var contains = false;
        if (obj.version) {
          var hash = obj.version.build_hash;
          contains = hashes.indexOf(hash) == -1;
          hashes.push(hash);
        }
        return contains;
      }).map(function(obj) {
        return obj.version.number;
      });
      $scope.versions = versions;
      $scope.version_warning = versions.length > 1;
      $scope.cluster_state = ClusterState.data.status;
      $scope.cluster_name = ClusterState.data.name;
      $scope.num_nodes = ClusterState.data.cluster.length;
      $scope.load1 = ClusterState.data.load[0] == '-.-' ? ClusterState.data.load[0] : ClusterState.data.load[0].toFixed(2);
      $scope.load1 = $scope.load1 < 0 ? 'N/A' : $scope.load1;
      $scope.load5 = ClusterState.data.load[1] == '-.-' ? ClusterState.data.load[1] : ClusterState.data.load[1].toFixed(2);
      $scope.load5 = $scope.load5 < 0 ? 'N/A' : $scope.load5;
      $scope.load15 = ClusterState.data.load[2] == '-.-' ? ClusterState.data.load[2] : ClusterState.data.load[2].toFixed(2);
      $scope.load15 = $scope.load15 < 0 ? 'N/A' : $scope.load15;
      $scope.version = ClusterState.data.version;
      $scope.major_minor_version = getMajorMinorVersion(ClusterState.data.version);
      $scope.docs_url = getDocsUrl($scope.major_minor_version);
      $scope.cluster_color_label = ClusterState.data.online ? colorMap[ClusterState.data.status] : '';
    };

    ClusterEventsHandler.register('STATE_REFRESHED', 'StatusBarController', updateClusterInfo);
    updateClusterInfo();

    // bind tooltips
    $('[rel=tooltip]').tooltip({
      placement: 'bottom'
    });

    var verified = null;

    // set user
    $scope.user = {
      uid: null
    };

    // 'analytics' might not be globally available if the user has an addblocker
    if ($window.analytics) {
      $window.analytics.load(UdcSettings.SegmentIoToken);
      $window.analytics.ready(function () {
        var user = $window.analytics.user();
        verified = {
          id: user.id(),
          traits: user.traits()
        };
      });

      var identify = function (userdata) {
        if (userdata.user.uid !== null) {
          $window.analytics.setAnonymousId(userdata.user.uid);
          $window.analytics.identify(userdata.user.uid);
          $window.analytics.page();
          if ($scope.version) {
            $window.analytics.track('visited_admin', {
              'version': $scope.version.number,
              'cluster_id': userdata.cluster_id
            });
          }
        }
      };
      UdcSettings.availability.then(function (data) {
        if (data.enabled === true) {
          // load uid
          UidLoader.load().then(function (uid) {
            $scope.user.uid = uid.toString();
            identify({
              'user': $scope.user,
              'cluster_id': data.cluster_id
            });
          },function (error) {
            console.warn(error);
          });
        }
      });
    }

    $scope.$on('$destroy', function () {
      //remove call back when controller is destroyed
      ClusterEventsHandler.remove('CHECKS_REFRESHED', 'StatusBarController');
    });
  })
  .controller('NavigationController', function ($scope, $rootScope, $location, NavigationService) {

    $scope.navBarElements = NavigationService.navBarElements;
    $scope.showSideNav = false;

    $rootScope.$on('showSideNav', function() {
      $scope.showSideNav = true;
    });

    $rootScope.$on('hideSideNav', function() {
      $scope.showSideNav = false;
    });

    $scope.isActive = function(viewLocation) {
      if (viewLocation == '/') {
        return viewLocation === $location.path();
      } else {
        return $location.path().substr(0, viewLocation.length) == viewLocation;
      }
    };
  })
  .service('Clipboard', function() {
    var copyToClipboard = function(text_to_share) {

      var copyElement = document.createElement('span');
      copyElement.appendChild(document.createTextNode(text_to_share));
      copyElement.id = 'tempCopyToClipboard';
      angular.element(document.body.append(copyElement));

      var range = document.createRange();
      range.selectNode(copyElement);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);

      document.execCommand('copy');
      window.getSelection().removeAllRanges();
      copyElement.remove();
    };
    return {
      'copy': copyToClipboard
    };
  })
  .service('NavigationService', function() {
    var navBarElements = [];

    var addNavBarElement = function(iconClass, text, urlPattern, index, state) {
      if (urlPattern.charAt(0) != '/') {
        urlPattern = '/' + urlPattern;
      }

      var pluginElement = {
        'text': text,
        'iconSrc': iconClass,
        'urlPattern': urlPattern,
        'position': index,
        'state': state
      };

      navBarElements.push(pluginElement);
      navBarElements.sort(function (a, b) {
        return a.position - b.position;
      });
    };

    // urlPattern is the identifier. TODO: need an actual identifier for each element
    var updateNavBarElement = function(urlPattern, text) {

      if (urlPattern.charAt(0) != '/') {
        urlPattern = '/' + urlPattern;
      }

      var queryElements = navBarElements.filter(function(item) {
        return item.urlPattern == urlPattern;
      });

      if (queryElements.length === 0) {
        return;
      }

      queryElements[0].text = text;
    };

    return {
      addNavBarElement: addNavBarElement,
      updateNavBarElement: updateNavBarElement,
      navBarElements: navBarElements
    };
  })
  .controller('LanguageSwitchController', function($scope, $translate) {
    $scope.showDropDown = false;
    $scope.toggleDropDown = function() {
      $scope.showDropDown = !$scope.showDropDown;
    };

    $scope.selectedLanguage = 'auto';

    $scope.changeLanguage = function(langKey) {
      // Check if AutoDetect is chosen, if yes, set langKey as preferredLanguage.
      langKey = langKey === 'auto' ? $translate.preferredLanguage() : langKey;
      $translate.use(langKey);
      $scope.selectedLanguage = langKey;
      $scope.toggleDropDown();
    };
  })
  .directive('crTooltip', function() {
    return {
      restrict: 'A',
      scope: {
        crTooltipPosition: '@'
      },
      link: function(scope, element) {
        $(element[0]).tooltip({
          placement: scope.crTooltipPosition
        });
      }
    };
  })
.directive('crCustomTooltip', function () {
  return {
    restrict: 'E',
    scope: {
      pageX: '=pageX',
      pageY: '=pageY'
    },
    trasclude: true,
    controller: function($scope) {
        $scope.updateTootipPosition = function () {
          var tw = Math.max($('#cr-custom-tooltip').outerWidth(), 400);
          var th = Math.max($('#cr-custom-tooltip').outerHeight(), 300);
          var x = $scope.pageX;
          var y = $scope.pageY;
          var w = $(document).width();
          var h = $(document).height();
          var css = {};

          if (x + tw >= w) {
            css.left = x - tw + 'px';
          } else {
            css.left = x + 'px';
          }
          if (y + th >= h) {
            css.top = y - th + 'px';
          } else {
            css.top = y + 'px';
          }

          $('#cr-custom-tooltip').css(css);
        };
      var watcherPageX = $scope.$watch('pageX', function () {
        $scope.updateTootipPosition();
      }, true);

      var watcherPageY = $scope.$watch('pageY', function () {
        $scope.updateTootipPosition();
      }, true);

      $scope.$on('$destroy', function() {
          //stop watching when scope is destroyed
          watcherPageY();
          watcherPageX();
      });
    }
  };
});

commons.run(function(NavigationService, $translate, $filter, $rootScope) {

  // Initial translation of navigation bar items
  NavigationService.addNavBarElement('static/assets/icon-overview.svg', $translate.instant('NAVIGATION.OVERVIEW'), '/', 10, "overview");
  NavigationService.addNavBarElement('static/assets/icon-console.svg', $filter('translate', 'NAVIGATION.CONSOLE'), '/console', 20, "console");
  NavigationService.addNavBarElement('static/assets/icon-table.svg', $filter('translate', 'NAVIGATION.TABLE'), '/tables', 30, "tables");
  NavigationService.addNavBarElement('static/assets/icon-view.svg', $filter('translate', 'NAVIGATION.VIEW'), '/views', 40, "views");
  NavigationService.addNavBarElement('static/assets/icon-cluster.svg', $filter('translate', 'NAVIGATION.CLUSTER'), '/nodes', 50, "nodes");

  // Update Navbar Elements if Language is Changed
  $rootScope.$on('$translateChangeSuccess', function() {
    $translate(['NAVIGATION.OVERVIEW', 'NAVIGATION.CONSOLE', 'NAVIGATION.TABLE', 'NAVIGATION.VIEW', 'NAVIGATION.CLUSTER']).then(function(i18n) {
      NavigationService.updateNavBarElement('/', i18n['NAVIGATION.OVERVIEW']);
      NavigationService.updateNavBarElement('/console', i18n['NAVIGATION.CONSOLE']);
      NavigationService.updateNavBarElement('/tables', i18n['NAVIGATION.TABLE']);
      NavigationService.updateNavBarElement('/views', i18n['NAVIGATION.VIEW']);
      NavigationService.updateNavBarElement('/nodes', i18n['NAVIGATION.CLUSTER']);
    });
  });
});

export default commons;
