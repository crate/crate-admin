'use strict';

import '../../app.module';

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
        case 'fr':
          return 'Français';
        default:
          return 'Auto';
      }
    };
  })
  .filter('formatTimestamp', function() {
    return function(timestamp) {
      var is_valid = timestamp == 0 || (new Date(timestamp)).getTime() > 0;
      if (!is_valid) {
        return 'Invalid Timestamp';
      }
      return new Date(timestamp).toISOString();
    };
  })
  .filter('formatTimeWithTimezone', function() {
    function formatTimeElement(element) {
      if (element < 10) {
        return '0' + Math.floor(element);
      } else {
        return String(Math.floor(element));
      }
    }
    function formatMicrosecondsSinceMidnight(microseconds) {
      const ms_in_second = 1000000;
      const ms_in_minute = 60*ms_in_second;
      const ms_in_hour = 60*ms_in_minute;

      var hours = formatTimeElement(microseconds / ms_in_hour);
      var remainder = microseconds % ms_in_hour;
      var minutes = formatTimeElement(remainder / ms_in_minute);
      remainder = remainder % ms_in_minute;
      var seconds = formatTimeElement(remainder / ms_in_second);
      remainder = remainder % ms_in_second;
      return `${hours}:${minutes}:${seconds}.${remainder}`;
    }
    function formatTimezone(seconds_from_utc) {
      var sign = seconds_from_utc < 0 ? '-' : '+';
      var hours = formatTimeElement(Math.abs(seconds_from_utc)/(60*60));
      var mins = formatTimeElement(Math.abs(seconds_from_utc)%(60*60)/60);
      return `${sign}${hours}:${mins}`;
    }
    return function([microseconds_since_midnight, seconds_from_utc]) {
      var time = formatMicrosecondsSinceMidnight(microseconds_since_midnight);
      var timezone = formatTimezone(seconds_from_utc);
      return `${time}${timezone}`;
    };
  });

export default filters_text;
