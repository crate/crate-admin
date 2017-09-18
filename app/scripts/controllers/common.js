'use strict';

var commons = angular.module('common', ['stats', 'udc'])
  .provider('Settings', function() {
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
  .controller('UnauthorizedCtrl', [function() {}])
  .controller('StatusBarController', function($scope, $rootScope, $log, $location, $translate, $sce,
    ClusterState, ChecksService, UidLoader, UdcSettings, Settings, Clipboard) {

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
    $scope.userName = Settings.user;

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

    $scope.$watch(function() {
      return ChecksService;
    }, function(data) {
      if (data.success === true) {
        var checks = [];
        checks.push.apply(checks, data.checks.cluster_checks);
        checks.push.apply(checks, data.checks.node_checks);
        var severity = checks.reduce(function(memo, obj) {
          return Math.max(memo, obj.severity);
        }, 1);
        $translate(['STATUSBAR.CHECK', 'STATUSBAR.CHECKS', 'STATUSBAR.FAILED']).then(function(i18n) {
          $scope.checks_message = $sce.trustAsHtml([checks.length, checks.length == 1 ? i18n['STATUSBAR.CHECK'] : i18n['STATUSBAR.CHECKS'], i18n['STATUSBAR.FAILED']].join('\u00A0'));
          $scope.config_label = LABELS[Math.min(severity - 1, LABELS.length - 1)];
        });
      } else {
        $translate(['STATUSBAR.CLUSTER_OFFLINE']).then(function(i18n) {
          $scope.checks_message = $sce.trustAsHtml(i18n['STATUSBAR.CLUSTER_OFFLINE']);
        });
        $scope.config_label = '';
      }
    }, true);

    $scope.$watch(function() {
      return ClusterState.data;
    }, function(data) {
      var hashes = [];
      var versions = data.cluster.filter(function(obj) {
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
      $scope.cluster_state = data.status;
      $scope.cluster_name = data.name;
      $scope.num_nodes = data.cluster.length;
      $scope.load1 = data.load[0] == '-.-' ? data.load[0] : data.load[0].toFixed(2);
      $scope.load1 = $scope.load1 < 0 ? 'N/A' : $scope.load1;
      $scope.load5 = data.load[1] == '-.-' ? data.load[1] : data.load[1].toFixed(2);
      $scope.load5 = $scope.load5 < 0 ? 'N/A' : $scope.load5;
      $scope.load15 = data.load[2] == '-.-' ? data.load[2] : data.load[2].toFixed(2);
      $scope.load15 = $scope.load15 < 0 ? 'N/A' : $scope.load15;
      $scope.version = data.version;
      $scope.major_minor_version = getMajorMinorVersion(data.version);
      $scope.docs_url = getDocsUrl($scope.major_minor_version);
      $scope.cluster_color_label = data.online ? colorMap[data.status] : '';
    }, true);

    // bind tooltips
    $('[rel=tooltip]').tooltip({
      placement: 'bottom'
    });

    var verified = null;

    // set user
    $scope.user = {
      uid: null
    };

    // 'analytics' is globally available
    analytics.load(UdcSettings.SegmentIoToken);
    analytics.ready(function() {
      var user = analytics.user();
      verified = {
        id: user.id(),
        traits: user.traits()
      };
    });

    var identify = function(userdata) {
      if (userdata.user.uid !== null) {
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
  .controller('NavigationController', function($scope, $rootScope, $location, NavigationService) {

    $scope.navBarElements = NavigationService.navBarElements;
    $scope.showSideNav = false;

    $rootScope.$on('showSideNav', function() {
      $scope.showSideNav = true;
    });

    $rootScope.$on('hideSideNav', function() {
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

    var addNavBarElement = function(iconClass, text, urlPattern, index) {
      if (urlPattern.charAt(0) != '/') {
        urlPattern = '/' + urlPattern;
      }

      var pluginElement = {
        'text': text,
        'iconSrc': iconClass,
        'urlPattern': urlPattern
      };

      if (typeof index === 'undefined') {
        navBarElements.push(pluginElement);
      } else if (index < 0 || index >= navBarElements.length) {
        navBarElements.push(pluginElement);
      } else {
        navBarElements.splice(index, 0, pluginElement);
      }
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
    return function(scope, element) {
      var elem = $(element),
        nav = $('.side-nav .navbar-nav'),
        win = $(window);
      var calculate = function() {
        scope.fixBottom = (nav.offset().top + nav.height() + elem.height() < win.height());
      };
      win.on('resize', calculate);
      calculate();
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
        crTooltipPosition: '='
      },
      link: function(scope, element, attrs) {
        $(element[0]).tooltip({
          placement: attrs.crTooltipPosition
        });
      }
    };
  })
.directive('crCustomTooltip', function ($compile, $sce) {
  return {
    restrict: 'A',
    scope: {
      data: '=tooltipData'
    },
    link: function (scope, element) {

      if (scope.data && scope.data.html) {
        var tooltip = angular.element(
          '<div id="cr-custom-tooltip" ng-show="displayTooltip" class="cr-custom-tooltip">' +
          scope.data.html +
          '</div>'
        );

        scope.displayTooltip = false;
        var setTop = false;
        var setLeft = false;
        var setBottom = false;
        var setRight = false;

        scope.updateTootipPosition = function (event) {
          var tw = 360;
          var th = 300;
          var x = event.pageX;
          var y = event.pageY;
          var w = $(document).width();
          var h = $(document).height();

          var margin_x, margin_y = 0;
          if (w > 700) {
            margin_x = 5;
          } else {
            margin_x = 20;
          }

          if (h > 600) {
            margin_x = 50;
          } else {
            margin_x = 5;
          }

          if (x + tw >= w) {
            if (!setLeft) {
              tooltip.css({
                right: w - x + margin_x + 'px'
              });
              setRight = true;
            }

          } else {
            if (!setRight) {
              tooltip.css({
                left: x - margin_x + 'px'
              });
              setLeft = true;
            }
          }
          if (y + th >= h) {
            if (!setTop) {
              tooltip.css({
                bottom: h - y - margin_y + 'px'
              });
              setBottom = true;
            }
          } else {
            if (!setBottom) {
              tooltip.css({
                top: y + 'px'
              });
              setTop = true;
            }
          }
        };

        scope.getSafeContent = function (content) {
          return $sce.trustAsHtml(content);
        };

        element.append(tooltip);

        element.on('mouseenter', function (event) {
          scope.updateTootipPosition(event);
          scope.displayTooltip = true;
          scope.$digest();
        });

        element.on('mousemove', function (event) {
          scope.updateTootipPosition(event);
          scope.$digest();
        });

        element.on('mouseleave', function () {
          scope.displayTooltip = false;
          scope.$digest();
        });

        element.on('click', function () {
          scope.displayTooltip = !scope.displayTooltip;
          scope.$digest();
        });
        $compile(tooltip)(scope);
      }
    }
  };
});

commons.run(function(NavigationService, $translate, $filter, $rootScope) {
  // Initial translation of navigation bar items
  NavigationService.addNavBarElement('static/assets/icon-overview.svg', $filter('translate', 'NAVIGATION.OVERVIEW'), '/');
  NavigationService.addNavBarElement('static/assets/icon-console.svg', $filter('translate', 'NAVIGATION.CONSOLE'), '/console');
  NavigationService.addNavBarElement('static/assets/icon-table.svg', $filter('translate', 'NAVIGATION.TABLE'), '/tables');
  NavigationService.addNavBarElement('static/assets/icon-cluster.svg', $filter('translate', 'NAVIGATION.CLUSTER'), '/nodes');


  // Update Navbar Elements if Language is Changed
  $rootScope.$on('$translateChangeSuccess', function() {
    $translate(['NAVIGATION.OVERVIEW', 'NAVIGATION.CONSOLE', 'NAVIGATION.TABLE', 'NAVIGATION.CLUSTER']).then(function(i18n) {
      NavigationService.updateNavBarElement('/', i18n['NAVIGATION.OVERVIEW']);
      NavigationService.updateNavBarElement('/console', i18n['NAVIGATION.CONSOLE']);
      NavigationService.updateNavBarElement('/tables', i18n['NAVIGATION.TABLE']);
      NavigationService.updateNavBarElement('/nodes', i18n['NAVIGATION.CLUSTER']);
    });
  });
});
