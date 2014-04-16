'use strict';

angular.module('common')
  .filter('roundWithUnit', function($filter, $sce) {
    return function(input, fraction) {
      if (fraction == undefined) {
        fraction = 3;
      }
      var res = '';
      if (Math.abs(Number(input)) >= 1.0e+9) {
        res = $filter('number')(Math.abs(Number(input)) / 1.0e+9, fraction) + "\u00A0Billion";
      } else if ( Math.abs(Number(input)) >= 1.0e+6) {
        res = $filter('number')(Math.abs(Number(input)) / 1.0e+6, fraction) + "\u00A0Million";
      } else {
        res = $filter('number')(Math.abs(Number(input)), 0);
      }
      return $sce.trustAsHtml(res);
    };
  })
  .filter('bytes', function($sce) {
        return function(bytes, precision) {
                if (bytes == 0 || isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
                if (typeof precision === 'undefined') precision = 1;
                var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
                        number = Math.floor(Math.log(bytes) / Math.log(1024));
                var res = (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  '\u00A0' + units[number];
                return $sce.trustAsHtml(res);
        };
   });
