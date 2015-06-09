'use strict';

angular.module('common')
  .filter('floor', function($filter){
    return function(value, fraction) {
      var n = Math.pow(10, fraction);
      return $filter('number')(Math.floor(value*n)/n, fraction);
    };
  })
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
                if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
                if (bytes === 0) return '0\u00A0bytes'
                if (typeof precision === 'undefined') precision = 1;
                var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
                        number = Math.floor(Math.log(bytes) / Math.log(1024));
                var res = (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  '\u00A0' + units[number];
                return $sce.trustAsHtml(res);
        };
   });
