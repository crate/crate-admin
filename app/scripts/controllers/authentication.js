'use strict';

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
        sessionStorage.setItem('crate.auth.token', $stateParams.token);
        $state.go('overview');
      }
    };
  });
