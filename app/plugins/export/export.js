'use strict';

angular.module('export', ['sql', 'translation'])
  .controller('ExportController', function($scope, SQLQuery, queryResultToObjects) {
  })
  .run(function(NavigationService, $translatePartialLoader, $filter, $rootScope, $translate) {

    $translatePartialLoader.addPart('./static/plugins/export');
    $translate.refresh();
    var iconSrc = 'static/plugins/export/static/icons/icon-export.png';
    var url = '/export';
    var position = 101;

    NavigationService.addNavBarElement(iconSrc, $filter('translate', 'NAVIGATION.EXPORT'), url, position, "export");

    // Update Navbar Elements if Language Changes
    $rootScope.$on('$translateChangeSuccess', function() {
      $translate('NAVIGATION.EXPORT').then(function(translation) {
        NavigationService.updateNavBarElement(url, translation);
      });
    });
  });
