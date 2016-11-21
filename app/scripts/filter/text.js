'use strict';

angular.module('common')
  .filter('capitalize', function() {
    return function(input, scope) {
      return input.substring(0, 1).toUpperCase() + input.substring(1);
    };
  })
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
  })
  .filter('severityText', function($filter) {
    return function(severity) {
      switch (severity) {
        case 1:
          return $filter('translate')("OVERVIEW.INFO");
        case 2:
          return $filter('translate')("OVERVIEW.WARNING");
        case 3:
          return $filter('translate')("OVERVIEW.CRITICAL");
        default:
          return $filter('translate')("OVERVIEW.INF'");
      }
    };
  })
  .filter('healthPanelClass', function() {
    return function(health) {
      switch (health) {
        case "good":
          return "cr-panel--success";
        case "warning":
          return "cr-panel--warning";
        case "danger":
          return "cr-panel--danger";
        case "--":
          return "cr-panel--default";
        default:
          return "cr-panel--default";
      }
    };
  })
  .filter('queryStatusClass', function($filter) {
    return function(status) {
      if (status == undefined) {
        return '';
      }
      if (status.indexOf('OK') !== -1) {
        return 'query-status--ok';
      }
      if (status.indexOf('ERROR') !== -1) {
        return 'query-status--error';
      }
      return '';
    };
  })
  .filter('languageFilter', function($filter) {
    return function(langkey) {
      switch (langkey) {
        case "en":
          return "English";
        case "de":
          return "Deutsch";
        case "es":
          return "Español";
        default:
          return "Auto";
      }
    };
  });
