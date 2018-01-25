'use strict';


const filters_numbers = angular.module('filters_numbers', [])
  .filter('floor', function($filter){
    var f = $filter('number');
    return function(value, fraction) {
      var n = Math.pow(10, fraction);
      return f(Math.floor(value*n)/n, fraction);
    };
  })
  .filter('roundWithUnit', function($filter, $sce) {
    var f = $filter('number');
    return function(input, fraction) {
      var res = '';
      if (typeof fraction === 'undefined') {
        fraction = 3;
      }
      if (Math.abs(Number(input)) >= 1.0e+9) {
        res = f(Math.abs(Number(input)) / 1.0e+9, fraction) + '\u00A0Billion';
      } else if ( Math.abs(Number(input)) >= 1.0e+6) {
        res = f(Math.abs(Number(input)) / 1.0e+6, fraction) + '\u00A0Million';
      } else {
        res = f(Math.abs(Number(input)), 0);
      }
      return $sce.trustAsHtml(res);
    };
  })
  .filter('bytes', function($sce) {
    var units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    return function(bytes, precision) {
      if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) {
        return '-';
      }
      if (bytes === 0) {
        return '0\u00A0B';
      }
      if (typeof precision === 'undefined') {
        precision = 1;
      }
      var number = Math.floor(Math.log(bytes) / Math.log(1024));
      var res = (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  '\u00A0' + units[number];
      return $sce.trustAsHtml(res);
    };
  });

export default filters_numbers;
