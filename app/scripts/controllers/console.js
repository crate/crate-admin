'use strict';

angular.module('console', ['sql'])
  .directive('console', function(SQLQuery){
    return {
      restrict: 'A',
      controller: ['$scope', '$translate', function($scope, $translate){
        var self = this;

        var inputScope = null;
        var statement = '';
        var displayedErrorTraceHint = localStorage.getItem('crate.console.displayed_error_trace_hint') === '1';
        $scope.showOptions = false;
        self.recentQueries = [];

        $scope.showErrorTrace = localStorage.getItem('crate.console.error_trace') === '1';

        $scope.error = {
          hide: true,
          message: '',
          error_trace:''
        };
        $scope.info = {
          hide: true,
          message: ''
        };

        self.setInputScope = function(scope) {
          inputScope = scope;
        };

        $scope.storeInLocalStorageChanged = function() {
          localStorage.setItem('crate.console.store_queries', $scope.useLocalStorage === true ? '1' : '0');
        };

        $scope.showErrorTraceChanged = function() {
          localStorage.setItem('crate.console.error_trace', $scope.showErrorTrace === true ? '1' : '0');
        };

        var getRecentQueriesFromLocalStorage = function() {
          var queryList = localStorage.getItem('crate.console.query_list');
          self.recentQueries = queryList ? JSON.parse(queryList) : [];
        };

        var updateRecentQueries = function(stmt) {
          if ($scope.useLocalStorage) {
            getRecentQueriesFromLocalStorage();
          }
          if (self.recentQueries[self.recentQueries.length -1] !== stmt) {
            self.recentQueries.push(stmt + ';');
          }
          if ($scope.useLocalStorage) {
            localStorage.setItem('crate.console.query_list', JSON.stringify(self.recentQueries));
          }
          inputScope.recentCursor = -1;
        };

        $scope.hide = function hide(item){
          item.hide = true;
          item.message = '';
        };

        $scope.toggleOptions = function toggleOptions(){
          $scope.showOptions = !$scope.showOptions;
        };

        $scope.clearLocalStorage = function() {
          $translate(['CONSOLE.CLEAR_HISTORY_MSG', 'CONSOLE.CLEAR_HISTORY_MSG_PLURAL']).then(function(i18n) {
            var history = JSON.parse(localStorage.getItem('crate.console.query_list') || '[]');
            localStorage.setItem('crate.console.query_list', JSON.stringify([]));
            inputScope.recentCursor = 0;
            self.recentQueries = [];
            var msg = history.length ? 0 : history.length + ' ';
            msg += ( history.length === 0 || history.length === 1 ) ? i18n['CONSOLE.CLEAR_HISTORY_MSG'] : i18n['CONSOLE.CLEAR_HISTORY_MSG_PLURAL'] ;
            $scope.info.message = msg;
            $scope.info.hide = false;
          });
        };

        $scope.isSafe = function(number) {
          if (Number.isInteger(number)) {
            return Number.isSafeInteger(number);
          }
          return true;
        };

        $scope.loadMoreRows = function loadMoreRows(amount) {
            $scope.limitToAmount += amount;
        };

        var doStoreQueries = localStorage.getItem('crate.console.store_queries') || '1';
        $scope.useLocalStorage = !!parseInt(doStoreQueries);
        getRecentQueriesFromLocalStorage();


        self.execute = function(sql) {
          var stmt = sql.replace(/^\s+|\s+$/g, '');

          if (stmt === '') {
            return;
          }
          stmt = stmt.replace(/([^;]);+$/, '$1');
          if (stmt.match(/^\s*select\s/ig) && !stmt.match(/limit\s+\d+/ig)) {
            stmt += ' limit 100';
          }

          updateRecentQueries(stmt);

          $scope.loading = true;
          $('#console-options').slideUp();
          SQLQuery.execute(stmt, {} , $scope.showErrorTrace)
          .success(function(sqlQuery) {
            $scope.loading = false;
            $scope.error.hide = true;
            $scope.error.message = '';
            $scope.error.error_trace = '';
            $scope.info.hide = true;
            $scope.info.message = '';
            $scope.renderTable = true;

            $scope.resultHeaders = [];
            for (var i = 0; i < sqlQuery.cols.length; i++) {
              $scope.resultHeaders.push(sqlQuery.cols[i]);
            }

            $scope.rows = sqlQuery.rows;
            $scope.status = sqlQuery.status();
            $scope.statement = stmt + ';';
            inputScope.updateInput($scope.statement);
          })
          .error(function(sqlQuery) {
            $scope.loading = false;
            $scope.error.hide = false;
            $scope.renderTable = false;
            $scope.error = sqlQuery.error;

            if (!$scope.showErrorTrace && !displayedErrorTraceHint) {
              displayedErrorTraceHint = true;
              localStorage.setItem('crate.console.displayed_error_trace_hint', '1');
            }

            $scope.status = sqlQuery.status();
            $scope.rows = [];
            $scope.resultHeaders = [];
          });
        };

        
        self.updateStatement = function(stmt) {
          statement = stmt || '';
        };

        $scope.execute = function() {
          self.execute(statement);
        };
      }]
    };
  })
  .directive('cli', function($timeout){
    return {
      restrict: 'E',
      transclude: true,
      templateUrl: 'views/editor.html',
      scope: {
        mimeType: '=',
        theme: '='
      },
      require: '^console',
      link: function($scope, element, attrs, $console) {

        var statement = '';
        var typedStatement = '';
        var input = $('textarea',element)[0];

        var editor = CodeMirror.fromTextArea(input, {
          mode: attrs.mimeType,
          theme: attrs.theme
        });

        // input change event
        editor.on('change', function(instance){
          statement = instance.getValue();
          $console.updateStatement(statement);
        });
        var selectStatementInput = function(stmt) {
          if (stmt) {
            editor.setValue(stmt);
          }
          $timeout(function() {
            editor.execCommand('selectAll');
          }, 10);
        };

        // function to get the recentQueries index
        var getRecentQueriesIndex = function(queryCount, recentCursor) {
          return (queryCount + recentCursor) > 0 ? queryCount + recentCursor : 0;
        };

        // key down event
        editor.on('keydown', function(instance, event){
          var cursorPos = event.target.selectionStart,
              queryCount = $console.recentQueries.length,
              cursor = instance.getCursor(),
              selection = instance.getSelection();

          if (!event.shiftKey && event.keyCode === 38) {
            // UP KEY
            if ((cursor.ch === 0 && cursor.line === 0) || (cursor.line === 0 && selection === statement)) {
              if ($scope.recentCursor === 0) {
                typedStatement = statement;
              }
              $scope.recentCursor--;
              statement = $console.recentQueries[getRecentQueriesIndex(queryCount, $scope.recentCursor)] || '';
              selectStatementInput(statement);
            }
          } else if (!event.shiftKey && event.keyCode === 40) {
            // DOWN KEY
            if (cursorPos >= event.target.textLength || cursorPos === 0 && event.target.selectionEnd === statement.length) {
              if (queryCount + $scope.recentCursor < queryCount) {
                $scope.recentCursor++;
                statement = $console.recentQueries[getRecentQueriesIndex(queryCount, $scope.recentCursor)] || typedStatement;
                selectStatementInput(statement);
              }
            }
          } else if (event.keyCode === 13 && !!event.shiftKey) {
            // SHIFT + ENTER KEY
              event.preventDefault();
              $console.execute(statement);
              typedStatement = '';
          } else {
            $scope.recentCursor = 0;
          }
        });

        $console.setInputScope($scope);
        $scope.recentCursor = 0;
        $scope.updateInput = function(stmt){
          selectStatementInput(stmt);
        };

      }
    };
  })
  .controller('ConsoleController', function() {
  });
