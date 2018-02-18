'use strict';

import Cookies from 'js-cookie';

angular.module('auth', [])
  .directive('authentication', function () {
    return {
      restrict: 'E',
      replace: true,
      scope: {
      },
      template: '<div></div>',
      controllerAs: 'AuthenticationController',
      controller: function ($scope, $location, $state, $stateParams) {
        Cookies.set('crate.auth.token', $stateParams.token);
        $state.go('overview');
    }
  }});
