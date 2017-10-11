'use strict';

angular.module('privileges', ['sql'])
  .factory('UserListService', function (SQLQuery, queryResultToObjects, $q) {
    var UserListService = {
      deferred: $q.defer()
    };

    var stmt = 'SELECT name, superuser FROM sys.users ORDER BY name';

    var cols = ['name', 'superuser'];

    UserListService.execute = function () {
      var deferred = $q.defer(),
        promise = deferred.promise;
      SQLQuery.execute(stmt, {}, false, false, true)
        .success(function (query) {
          var result = queryResultToObjects(query, cols);
          deferred.resolve(result);
        })
        .error(function () {
          deferred.reject();
        });

      return promise;
    };

    return UserListService;
  })
  .factory('UserPrivilegesService', function (SQLQuery, queryResultToObjects, $q) {
    var UserPrivilegesService = {
      deferred: $q.defer()
    };

    function stmt(username) {
      return 'SELECT grantee, class, ident, state, type FROM sys.privileges WHERE grantee=\'' + username + '\';';
    }

    var cols = ['grantee', 'class', 'ident', 'state', 'type'];

    UserPrivilegesService.execute = function (username) {
      var deferred = $q.defer(),
        promise = deferred.promise;
      SQLQuery.execute(stmt(username), {}, false, false, true)
        .success(function (query) {
          var result = queryResultToObjects(query, cols);
          deferred.resolve(result);
        })
        .error(function () {
          deferred.reject();
        });

      return promise;
    };

    return UserPrivilegesService;
  })
  .directive('userList', function () {
    return {
      restrict: 'E',
      replace: true,
      require: '^PrivilegesController',
      scope: {
        users: '='
      },
      templateUrl: 'plugins/privileges/userList.html',
      controllerAs: 'UserListController',
      controller: function ($scope, $location, $state) {
        $scope.currentUser = $scope.$parent.selectedUser;
        $scope.setUser = function (user) {
          $scope.currentUser = user;
          //update selectedUser in Parent 
          $scope.$parent.selectedUser = user;
          $location.search('user', user.name);
          $state.go('privileges.privilege', {
            user: $scope.currentUser.name
          });
        };

        $scope.isSelectedUser = function (user) {
          return user.name == $scope.$parent.selectedUser.name;
        };
      }
    };
  })
  .directive('privilegesDetail', function () {
    return {
      restrict: 'E',
      replace: true,
      require: '^PrivilegesController',
      scope: {},
      templateUrl: 'plugins/privileges/privileges-detail.html',
      controllerAs: 'PrivilegesDetailController',
      controller: function ($scope, $state, $q, UserPrivilegesService) {
        $scope.currentUser = $scope.$parent.selectedUser;
        $scope.showError = $scope.$parent.showError;

        $q.when(UserPrivilegesService.execute($scope.currentUser.name))
          .then(function (privileges) {
            $scope.userPrivileges = privileges;
          });
      }
    };
  })
  .directive('privileges', function () {
    return {
      restrict: 'E',
      replace: true,
      scope: {},
      templateUrl: 'plugins/privileges/privileges.html',
      controllerAs: 'PrivilegesController',
      controller: function ($scope, UserListService, $rootScope, $location, $q, $state) {
        $scope.userList = [];
        $scope.showError = false;
        $scope.selectedUser = {};
        $scope.userPrivileges = [];
        $scope.renderSidebar = true;

        function getDefaultUser(userList) {
          var search = $location.search();
          if (search && search.user) {
            return userList.filter(function (user) {
              return user.name == search.user;
            })[0];
          }
          return userList[0];
        }

        $q.when(UserListService.execute())
          .then(function (response) {
            $scope.userList = response;
            if ($scope.userList.length > 0) {
              $scope.selectedUser = getDefaultUser($scope.userList);
              $state.go('privileges.privilege', {
                user: $scope.selectedUser.name
              });
            }
          }).catch(function () {
            $scope.showError = true;
            $scope.renderSidebar = false;
          });

        $rootScope.$on('hideSideNav', function () {
          $scope.renderSidebar = false;
        });
        $rootScope.$on('showSideNav', function () {
          $scope.renderSidebar = $scope.userList.length > 0 && !$scope.showError;
        });
      }
    };
  }).run(function ($window, NavigationService, $translatePartialLoader, $filter, $rootScope, $translate) {

    $translatePartialLoader.addPart('./plugins/privileges');
    $translate.refresh();
    var iconSrc = 'plugins/privileges/static/icons/icon-user.svg';
    var url = '/privileges';
    var position = 42;

    NavigationService.addNavBarElement(iconSrc, $filter('translate', 'NAVIGATION.PRIVILEGES'), url, position);

    // Update Navbar Elements if Language Changes
    $rootScope.$on('$translateChangeSuccess', function () {
      $translate('NAVIGATION.PRIVILEGES').then(function (translation) {
        NavigationService.updateNavBarElement(url, translation);
      });
    });
  });
