'use strict';

angular.module('common')
  .filter('capitalize', function() {
    return function(input, scope) {
      return input.substring(0, 1).toUpperCase() + input.substring(1);
    };
  });

angular.module('common')
  .filter('severityClass', function() {
    return function(severity) {
      switch (severity) {
        case 1:
          return "severity--info";
        case 2:
          return "severity--warning";
        case 3:
          return "severity--danger";
        default:
          return "severity--info";
      }
    };
  });

angular.module('common')
  .filter('severityText', function($filter) {
    return function(severity) {
      switch (severity) {
        case 1:
          return $filter('translate')("OVERVIEW.INFO");
        case 2:
          return  $filter('translate')("OVERVIEW.WARNING");
        case 3:
          return  $filter('translate')("OVERVIEW.CRITICAL");
        default:
          return  $filter('translate')("OVERVIEW.INF'");
      }
    };
  });