'use strict';

angular.module('common')
  .filter('capitalize', function() {
    return (input, scope) => {
        return input.substring(0, 1).toUpperCase() + input.substring(1);
    };
  });
