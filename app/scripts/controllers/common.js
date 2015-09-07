'use strict';

var commons = angular.module('common', ['stats', 'udc'])
  .controller('StatusBarController', function ($scope, $log, $location, $sce, ClusterState) {
    var colorMap = {"good": 'label-success',
                    "warning": 'label-warning',
                    "critical": 'label-danger',
                    '--': 'label-danger'};
    var DOCS_BASE_URL = 'https://crate.io/docs';
    var getDocsUrl = function getDocsUrl(version) {
      return $sce.trustAsResourceUrl(DOCS_BASE_URL + (version ? '/en/'+version.number : '/stable') + '/');
    };
    $scope.cluster_color_label = 'label-default';
    $scope.$watch( function () { return ClusterState.data; }, function (data) {
      var hashes = [];
      var versions = data.cluster.filter(function(obj, idx){
        var contains = false;
        if (obj.version) {
          var hash = obj.version.build_hash;
          contains = hashes.indexOf(hash) == -1;
          hashes.push(hash);
        }
        return contains;
      }).map(function(obj, idx){
        return obj.version.number;
      });
      $scope.versions = versions;
      $scope.version_warning = versions.length > 1;
      $scope.cluster_state = data.status;
      $scope.cluster_name = data.name;
      $scope.num_nodes = data.cluster.length;
      $scope.cluster_color_label = colorMap[data.status];
      $scope.load1 = data.load[0]  == '-.-' ? data.load[0] : data.load[0].toFixed(2);
      $scope.load5 = data.load[1]  == '-.-' ? data.load[1] : data.load[1].toFixed(2);
      $scope.load15 = data.load[2] == '-.-' ? data.load[2] : data.load[2].toFixed(2);
      $scope.version = data.version;
      $scope.docs_url = getDocsUrl(data.version);
    }, true);

    // bind tooltips
    $("[rel=tooltip]").tooltip({ placement: 'bottom'});
  })
  .controller('NavigationController', function ($scope, $location, NavigationService) {

    $scope.navBarElements = NavigationService.navBarElements;

    $scope.isActive = function (viewLocation) {
      if (viewLocation == '/') {
        return viewLocation === $location.path();
      } else {
        return $location.path().substr(0, viewLocation.length) == viewLocation;
      }
    };
  })
  .service('NavigationService', function() {
    this.navBarElements = [];

    this.addNavBarElement = function(iconClass, text, urlPattern, index) {

      if (urlPattern.charAt(0) != '/') {
        urlPattern = "/" + urlPattern;
      }

      var pluginElement = {
        "text" : text,
        "iconClass" : iconClass,
        "urlPattern" : urlPattern
      };

      if (typeof index === 'undefined') {
        this.navBarElements.push(pluginElement);
      } else if (index < 0 || index >= this.navBarElements.length) {
        this.navBarElements.push(pluginElement);
      } else {
        this.navBarElements.splice(index, 0, pluginElement);
      }
    };
  })
  .directive('fixBottom', function(){
    return function(scope, element, attr){
      var elem = $(element),
          nav = $('.side-nav .navbar-nav'),
          win = $(window);
      var calculate = function calculate(){
        scope.fixBottom = (nav.offset().top + nav.height() + elem.height() < win.height());
      };
      win.on("resize", calculate);
      calculate();
    };
  })
.controller('HelpMenuController', function ($scope, UidLoader, UdcSettings) {
  var verified = null;
  
  // set user
  $scope.user = {
    uid: null
  };
  
  // 'analytics' is globally available
  analytics.load(UdcSettings.SegmentIoToken)
  analytics.ready(function(){
    var user = analytics.user();
    verified = {
      id: user.id(),
      traits: user.traits()
    };
  });
  
  var identify = function identify(user){
    if (user.uid != null) {
      analytics.setAnonymousId(user.uid);
      // check for messsages
      analytics.page();
      analytics.track('visited_admin', { version: $scope.version.number});
    }
  };

  UdcSettings.availability.success(function(isEnabled){
    if (isEnabled === true) {
      // load uid
      UidLoader.load().success(function(uid){
        $scope.user.uid = uid.toString();
        identify($scope.user);
      }).error(function(error){
        console.warn(error);
      });
    }
  });
});


commons.run(function(NavigationService) {
  NavigationService.addNavBarElement("fa fa-th-large", "Overview", "/");
  NavigationService.addNavBarElement("fa fa-code", "Console", "/console");
  NavigationService.addNavBarElement("fa fa-table", "Tables", "/tables");
  NavigationService.addNavBarElement("fa fa-sitemap", "Cluster", "/nodes");
});
