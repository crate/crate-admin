'use strict';

angular.module('console', ['sql'])
  .controller('ConsoleController', function ($scope, $http, $location, SQLQuery, $log) {

    $scope.statement = "";
    $scope.rows = [];

    $('iframe').hide();

    $scope.resultHeaders = [];
    $scope.renderTable = false;
    $scope.error = {};
    $scope.error.hide = true;

    var loadingIndicator = Ladda.create(document.querySelector('button[type=submit]'));

    $scope.execute = function() {
      var stmt = $scope.statement;
      if (stmt === "") return;
      stmt = stmt.replace(/([^;]);+$/, "$1");
      if (stmt.match(/select/ig) && !stmt.match(/limit\s+\d+/ig)) stmt += " limit 100";
      loadingIndicator.start();

      SQLQuery.execute(stmt).
        success(function(sqlQuery) {
          loadingIndicator.stop();
          $scope.error.hide = true;
          $scope.renderTable = true;

          $scope.resultHeaders = [];
          for (var col in sqlQuery.cols) {
              $scope.resultHeaders.push(sqlQuery.cols[col]);
          }

          $scope.rows = sqlQuery.rows;
          $scope.status = sqlQuery.status();
          $scope.statement = stmt + ";";
        }).
        error(function(sqlQuery) {
          loadingIndicator.stop();
          $scope.error.hide = false;
          $scope.renderTable = false;
          $scope.error.message = sqlQuery.error.message;
          $scope.status = sqlQuery.status();
          $scope.rows = [];
          $scope.resultHeaders = [];
        });
    };

  });
