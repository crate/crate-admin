'use strict';

angular.module('common', ['stats', 'udc'])
  .controller('StatusBarController', function ($scope, $log, $location, $sce, ClusterState) {
    var colorMap = {"good": '',
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
  .controller('NavigationController', function ($scope, $location) {
    $scope.isActive = function (viewLocation) {
      if (viewLocation == '/') {
        return viewLocation === $location.path();
      } else {
        return $location.path().substr(0, viewLocation.length) == viewLocation;
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
    var b = (user.email && user.uid && user.enabled);
    if (!b) return;
    // identify user
    analytics.identify(user.uid, {
      email: user.email
    }, {
      userAgent: navigator.userAgent,
      integrations: {
        'All': false,
        'Intercom': {}
      }
    });
    // check for messsages
    analytics.page();
  };

  // set user
  $scope.user = {
    email: UdcSettings.Email.get(),
    uid: null,
    enabled: UdcSettings.Email.get() !== null
  };

  // enable email support
  $scope.enable = function enable(data){
    UdcSettings.Email.set(data.email);
    $scope.user.enabled = true;
    identify($scope.user);
  };

  // disable email support
  $scope.disable = function disable(){
    UdcSettings.Email.unset();
    $scope.user.enabled = false;
    $scope.user.email = null;
    analytics.reset();
    $('#intercom-container').remove();
  };

  // load uid
  UidLoader.load().success(function(uid){
    $scope.user.uid = uid.toString();
    identify($scope.user);
  }).error(function(error){
    console.warn(error);
  }).notify(function(event){
  });
});
