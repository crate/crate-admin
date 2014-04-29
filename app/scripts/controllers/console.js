'use strict';

angular.module('console', ['sql'])
  .controller('ConsoleController', function ($scope, $http, $location, SQLQuery, $log, $timeout, $window) {

    $scope.statement = "";
    $scope.typedStatement = "";
    $scope.rows = [];

    $scope.resultHeaders = [];
    $scope.renderTable = false;
    $scope.error = {};
    $scope.error.hide = true;

    var loadingIndicator = Ladda.create(document.querySelector('button[type=submit]'));

    $scope.storeInLocalStorageChanged = function() {
      localStorage.setItem('crate.console.store_queries', $scope.useLocalStorage === true ? "1" : "0");
    };

    var getRecentQueriesFromLocalStorage = function() {
      var v = localStorage.getItem("crate.console.query_list");
      $scope.recentQueries = v ? JSON.parse(v) : [];
    };

    var updateRecentQueries = function(stmt) {
      if ($scope.useLocalStorage) {
        getRecentQueriesFromLocalStorage();
      }
      if ($scope.recentQueries[$scope.recentQueries.length -1] !== stmt) {
        $scope.recentQueries.push(stmt + ";");
      }
      if ($scope.useLocalStorage) {
        localStorage.setItem("crate.console.query_list", JSON.stringify($scope.recentQueries));
      }
      $scope.typedStatement = "";
      $scope.recentCursor = -1;
    };

    $scope.toggleOptions = function toggleOptions(){
      $('#console-options').slideToggle();
    };

    $scope.clearLocalStorage = function() {
      var history = JSON.parse(localStorage.getItem("crate.console.query_list") || '[]');
      localStorage.setItem("crate.console.query_list", JSON.stringify([]));
      $scope.recentCursor = 0;
      $scope.recentQueries = [];
      var msg = history.length == 1 ? "1 entry in console history has been cleared." :
            history.length + " entries in console history have been cleared.";
      $window.alert(msg);
    };

    var v = localStorage.getItem("crate.console.store_queries") || '1';
    $scope.useLocalStorage = !!parseInt(v);
    $scope.recentCursor = 0;
    getRecentQueriesFromLocalStorage();

    $scope.stmtKeyDown = function(event) {
      var cursorPos = event.target.selectionStart,
          queryCount, semicolonPos;
      if (!event.shiftKey && event.keyCode === 38) {
        // UP KEY
        if (cursorPos === 0) {
          queryCount = $scope.recentQueries.length;
          if (queryCount + $scope.recentCursor > 0) {
            if ($scope.recentCursor === 0) {
              $scope.typedStatement = $scope.statement;
            }
            $scope.recentCursor--;
            $scope.statement = $scope.recentQueries[queryCount + $scope.recentCursor];
            selectStatementInput();
          }
        }
      } else if (!event.shiftKey && event.keyCode === 40) {
        // DOWN KEY
        if (cursorPos >= event.target.textLength || cursorPos === 0 && event.target.selectionEnd === $scope.statement.length) {
          queryCount = $scope.recentQueries.length;
          if (queryCount + $scope.recentCursor < queryCount) {
            $scope.recentCursor++;
            $scope.statement = $scope.recentQueries[queryCount + $scope.recentCursor] || $scope.typedStatement;
            selectStatementInput();
          }
        }
      } else if (event.keyCode === 13) {
        // ENTER KEY
        semicolonPos = $scope.statement.indexOf(';');
        if (!!event.shiftKey || semicolonPos !== -1 && (semicolonPos < cursorPos || cursorPos != event.target.selectionEnd)) {
          event.preventDefault();
          $scope.execute();
        }
      }
    };

    $scope.stmtChange = function(event) {
      $scope.recentCursor = 0;
    };

    var selectStatementInput = function() {
      $timeout(function() {
        $("#console-statement-input").select();
      }, 1);
    };

    $scope.execute = function() {
      var stmt = $scope.statement;

      if (stmt === "") return;
      stmt = stmt.replace(/([^;]);+$/, "$1");
      if (stmt.match(/select/ig) && !stmt.match(/limit\s+\d+/ig)) stmt += " limit 100";

      updateRecentQueries(stmt);
      selectStatementInput();

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
          selectStatementInput();
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
