'use strict';

angular.module('tutorial', ['translation'])
  .controller('TutorialController', function($translate, $translatePartialLoader) {

    $translatePartialLoader.addPart('./static/plugins/tutorial');
    $translate.refresh();

  })
  .run(function($window, NavigationService, $translatePartialLoader, $filter, $rootScope, $translate) {
    $translatePartialLoader.addPart('./static/plugins/tutorial');
    var iconSrc = 'static/plugins/tutorial/static/icons/icon-getstarted.svg';
    var url = '/help';
    var position = 100;
    NavigationService.addNavBarElement(iconSrc, $filter('translate', 'NAVIGATION.HELP'), url, position, "tutorial");

    // Update Navbar Elements if Language Changes
    $rootScope.$on('$translateChangeSuccess', function() {
      $translate('NAVIGATION.HELP').then(function(translation) {
        NavigationService.updateNavBarElement(url, translation);
      });
    });
  });
