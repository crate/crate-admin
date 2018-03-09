'use strict';

const filters_text = angular.module('filters_text', [])
  .filter('capitalize', function() {
    return function(input) {
      return input.substring(0, 1).toUpperCase() + input.substring(1);
    };
  })
  .service('SeverityClass', function() {
    return function(severity) {
      switch (severity) {
        case 1:
          return 'severity--info';
        case 2:
          return 'severity--warning';
        case 3:
          return 'severity--danger';
        default:
          return 'severity--info';
      }
    };
  })
  .filter('severityText', function($filter) {
    return function(severity) {
      var translate = $filter('translate');
      switch (severity) {
        case 1:
          return translate('OVERVIEW.INFO');
        case 2:
          return translate('OVERVIEW.WARNING');
        case 3:
          return translate('OVERVIEW.CRITICAL');
        default:
          return translate('OVERVIEW.INF');
      }
    };
  })
  .service('HealthPanelClass', function() {
    return function(health) {
      switch (health) {
        case 'good':
          return 'cr-panel--success';
        case 'warning':
          return 'cr-panel--warning';
        case 'danger':
          return 'cr-panel--danger';
        case 'critical':
          return 'cr-panel--danger';
        case 'unreacheable':
          return 'cr-panel--unreacheable';
        case '--':
          return 'cr-panel--default';
        default:
          return 'cr-panel--default';
      }
    };
  })
  .filter('languageFilter', function() {
    return function(langkey) {
      switch (langkey) {
        case 'en':
          return 'English';
        case 'de':
          return 'Deutsch';
        case 'es':
          return 'Español';
        default:
          return 'Auto';
      }
    };
  })
  .filter('formatTimestamp', function() {
    return function(timestamp) {
      return new Date(timestamp).toISOString();
    };
  });

export default filters_text;
