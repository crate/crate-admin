'use strict';

angular.module('privileges', ['sql'])
  .factory('UserListService', function(SQLQuery, queryResultToObjects, $q) {
    var UserListService = {
      deferred: $q.defer()
    };

    var stmt = 'SELECT name, superuser FROM sys.users ORDER BY name';

    var cols = ['name', 'superuser'];

    UserListService.execute = function() {
      var deferred = $q.defer(),
        promise = deferred.promise;
      SQLQuery.execute(stmt, {}, false, false, true)
        .success(function(query) {
          var result = queryResultToObjects(query, cols);
          deferred.resolve(result);
        })
        .error(function() {
          deferred.reject();
        });

      return promise;
    };

    return UserListService;
  })
  .factory('UserPrivilegesService', function(SQLQuery, queryResultToObjects, $q) {
    var UserPrivilegesService = {
      deferred: $q.defer()
    };

    function stmt(username) {
      return 'SELECT grantee, class, ident, state, type FROM sys.privileges WHERE grantee=\'' + username + '\';';
    }

    var cols = ['grantee', 'class', 'ident', 'state', 'type'];

    UserPrivilegesService.execute = function(username) {
      var deferred = $q.defer(),
        promise = deferred.promise;
      SQLQuery.execute(stmt(username), {}, false, false, true)
        .success(function(query) {
          var result = queryResultToObjects(query, cols);
          deferred.resolve(result);
        })
        .error(function() {
          deferred.reject();
        });

      return promise;
    };

    return UserPrivilegesService;
  })
  .directive('userList', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        users: '=',
        currentUser: '='
      },
      require: '^PrivilegesDetailController',
      templateUrl: 'plugins/privileges/userList.html',
      controllerAs: 'UserListController',
      controller: function($scope, $location) {

        $scope.setUser = function(user) {
          $scope.currentUser = user;
          $location.search('user=' + user.name);
        };

        $scope.isSelectedUser = function(user) {
          return user.name == $scope.currentUser.name;
        };
      }
    };
  })
  .controller('PrivilegesDetailController', function($scope, UserListService, $q, $route, UserPrivilegesService, $rootScope, $location) {
    $scope.userList = [];
    $scope.showError = false;
    $scope.currentUser = {};
    $scope.userPrivileges = [];
    $scope.renderSidebar = true;

    function getDefaultUser(userList) {
      var search = $location.search();
      if (search && search.user) {
        return userList.filter(function(user) {
          return user.name == search.user;
        })[0];
      }
      return userList[0];
    }

    $q.when(UserListService.execute())
      .then(function(response) {
        $scope.userList = response;
        if ($scope.userList.length > 0) {
          $scope.currentUser = getDefaultUser($scope.userList);
        }
      }).catch(function() {
        $scope.showError = true;
        $scope.renderSidebar = false;
      });

    function updateUserPrivileges(user) {
      $q.when(UserPrivilegesService.execute(user.name))
        .then(function(privileges) {
          $scope.userPrivileges = privileges;
        });
    }

    $scope.$watch('currentUser', function() {
      updateUserPrivileges($scope.currentUser);
    });

    $rootScope.$on('hideSideNav', function() {
      $scope.renderSidebar = false;
    });
    $rootScope.$on('showSideNav', function() {
      $scope.renderSidebar = $scope.userList.length > 0 && !$scope.showError;
    });
  })
  .run(function($window, NavigationService, $translatePartialLoader, $filter, $rootScope, $translate) {

    $translatePartialLoader.addPart('./plugins/privileges');
    $translate.refresh();
    var iconSrc = 'plugins/privileges/static/icons/icon-user.svg';
    var url = '/privileges';
    var position = 4;

    NavigationService.addNavBarElement(iconSrc, $filter('translate', 'NAVIGATION.PRIVILEGES'), url, position);

    // Update Navbar Elements if Language Changes
    $rootScope.$on('$translateChangeSuccess', function() {
      $translate('NAVIGATION.PRIVILEGES').then(function(translation) {
        NavigationService.updateNavBarElement(url, translation);
      });
    });
  });
