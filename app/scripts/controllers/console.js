'use strict';

angular.module('console', ['sql', 'datatypechecks'])
  .factory('KeywordObjectCreator', function() {
    return {
      create: function(arr) {
        return arr.reduce(function(accumulator, currentValue) {
          accumulator[currentValue.toLowerCase()] = true;
          return accumulator;
        }, {});
      }
    };
  })
  .directive('console', function(SQLQuery, ColumnTypeCheck){
    return {
      restrict: 'A',
      controller: ['$scope', '$translate', '$location', 'Clipboard', '$timeout', function($scope, $translate, $location, Clipboard, $timeout){
        var self = this;

        var inputScope = null;
        var statement = '';
        var displayedErrorTraceHint = localStorage.getItem('crate.console.displayed_error_trace_hint') === '1';
        $scope.showOptions = false;
        self.recentQueries = [];

        $scope.showErrorTrace = localStorage.getItem('crate.console.error_trace') === '1';
        $scope.formatResults = (localStorage.getItem('crate.console.format_results') || '1') === '1';

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

        $scope.formatReturnedResults = function () {
          localStorage.setItem('crate.console.format_results', $scope.formatResults === true ? '1' : '0');
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
          if (inputScope) {
            inputScope.recentCursor = -1;
          }
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
        $scope.ColumnTypeCheck = ColumnTypeCheck;

        $scope.loadMoreRows = function loadMoreRows(amount) {
            $scope.limitToAmount += amount;
        };

        var doStoreQueries = localStorage.getItem('crate.console.store_queries') || '1';
        $scope.useLocalStorage = !!parseInt(doStoreQueries);
        getRecentQueriesFromLocalStorage();


        self.execute = function(sql) {
          $scope.renderTable = false;
          
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
          SQLQuery.execute(stmt, {} , $scope.showErrorTrace, true, true)
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

            $scope.resultHeaderTypes = [];
            for (i = 0; i < sqlQuery.col_types.length; i++) {
              $scope.resultHeaderTypes.push(sqlQuery.col_types[i]);
            }

            $scope.rows = sqlQuery.rows;
            $scope.limitToAmount = 0;
            $scope.loadMoreRows(100);
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
          $location.search('query', statement);
        };

        $scope.share = function () {
          if (statement) {
            $location.search('query', statement);
            Clipboard.copy($location.absUrl());
          }
        };
        $timeout(function () {
          if ($location.search().exec === 'y' && $location.search().query) {
            self.execute($location.search().query);
          }
        }, 5);
      }]
    };
  })
  .directive('cli', function($timeout, KeywordObjectCreator, $location){
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

        var statement = $location.search().query || '';
        var typedStatement = $location.search().query || '';
        var input = $('textarea',element)[0];

        CodeMirror.defineMIME('text/x-cratedb', {
          name: 'sql',
          keywords: KeywordObjectCreator.create([
            'abs', 'absolute', 'action', 'add', 'after', 'alias', 'all', 'allocate',
            'alter', 'always', 'analyzer', 'and', 'any', 'are', 'array', 'array_agg',
            'array_max_cardinality', 'as', 'asc', 'asensitive', 'assertion',
            'asymmetric', 'at', 'atomic', 'authorization', 'avg', 'before', 'begin',
            'begin_frame', 'begin_partition', 'between', 'bigint', 'binary', 'bit',
            'bit_length', 'blob', 'boolean', 'both', 'breadth', 'by', 'byte', 'call',
            'called', 'cardinality', 'cascade', 'cascaded', 'case', 'cast',
            'catalog', 'catalogs', 'ceil', 'ceiling', 'char', 'char_filters',
            'char_length', 'character', 'character_length', 'check', 'clob', 'close',
            'clustered', 'coalesce', 'collate', 'collation', 'collect', 'column',
            'columns', 'commit', 'condition', 'connect', 'connection', 'constraint',
            'constraints', 'constructor', 'contains', 'continue', 'convert', 'copy',
            'corr', 'corresponding', 'count', 'covar_pop', 'covar_samp', 'create',
            'cross', 'cube', 'cume_dist', 'current', 'current_catalog',
            'current_date', 'current_path', 'current_role', 'current_row',
            'current_schema', 'current_time', 'current_timestamp', 'current_user',
            'cursor', 'cycle', 'data', 'date', 'day', 'deallocate', 'dec', 'decimal',
            'declare', 'default', 'deferrable', 'deferred', 'delete', 'deny', 'dense_rank',
            'depth', 'deref', 'desc', 'describe', 'descriptor', 'deterministic',
            'diagnostics', 'directory', 'disconnect', 'distinct', 'distributed',
            'do', 'domain', 'double', 'drop', 'duplicate', 'dynamic', 'each',
            'element', 'else', 'elseif', 'end', 'end_exec', 'end_frame',
            'end_partition', 'equals', 'escape', 'every', 'except', 'exception',
            'exec', 'execute', 'exists', 'exit', 'explain', 'extends', 'external',
            'extract', 'false', 'fetch', 'filter', 'first', 'first_value', 'float',
            'for', 'foreign', 'format', 'found', 'frame_row', 'free', 'from', 'full',
            'fulltext', 'function', 'functions', 'fusion', 'general', 'generated',
            'geo_point', 'geo_shape', 'get', 'global', 'go', 'goto', 'grant',
            'group', 'grouping', 'groups', 'handler', 'having', 'hold', 'hour',
            'identity', 'if', 'ignored', 'immediate', 'in', 'index', 'indicator',
            'initially', 'inner', 'inout', 'input', 'insensitive', 'insert', 'int',
            'integer', 'intersect', 'intersection', 'interval', 'into', 'ip', 'is',
            'isolation', 'iterate', 'join', 'key', 'kill', 'language', 'large',
            'last', 'last_value', 'lateral', 'lead', 'leading', 'leave', 'left',
            'level', 'like', 'like_regex', 'limit', 'ln', 'local', 'localtime',
            'localtimestamp', 'locator', 'long', 'loop', 'lower', 'map', 'match',
            'max', 'member', 'merge', 'method', 'min', 'minute', 'mod', 'modifies',
            'module', 'month', 'multiset', 'names', 'national', 'natural', 'nchar',
            'nclob', 'new', 'next', 'no', 'none', 'normalize', 'not', 'nth_value',
            'ntile', 'null', 'nullif', 'nulls', 'numeric', 'object', 'octet_length',
            'of', 'off', 'offset', 'old', 'on', 'only', 'open', 'optimize', 'option',
            'or', 'order', 'ordinality', 'out', 'outer', 'output', 'over',
            'overlaps', 'overlay', 'pad', 'parameter', 'partial', 'partition',
            'partitioned', 'partitions', 'path', 'percent', 'percent_rank',
            'percentile_cont', 'percentile_disc', 'period', 'persistent', 'plain',
            'portion', 'position', 'position_regex', 'power', 'precedes',
            'preceding', 'precision', 'prepare', 'preserve', 'primary',
            'primary key', 'prior', 'privileges', 'procedure', 'public', 'range',
            'rank', 'read', 'reads', 'real', 'recursive', 'ref', 'references',
            'referencing', 'refresh', 'regr_avgx', 'regr_avgy', 'regr_count',
            'regr_intercept', 'regr_r2', 'regr_slope', 'regr_sxx',
            'regr_sxyregr_syy', 'relative', 'release', 'rename', 'repeat', 'repository',
            'reset', 'resignal', 'restore', 'restrict', 'result', 'return',
            'returns', 'revoke', 'right', 'role', 'rollback', 'rollup', 'routine',
            'row', 'row_number', 'rows', 'savepoint', 'schema', 'schemas', 'scope',
            'scroll', 'search', 'second', 'section', 'select', 'sensitive',
            'session', 'session_user', 'set', 'sets', 'shards', 'short', 'show',
            'signal', 'similar', 'size', 'smallint', 'snapshot', 'some', 'space',
            'specific', 'specifictype', 'sql', 'sqlcode', 'sqlerror', 'sqlexception',
            'sqlstate', 'sqlwarning', 'sqrt', 'start', 'state', 'static',
            'stddev_pop', 'stddev_samp', 'stratify', 'stratify', 'strict', 'string',
            'submultiset', 'substring', 'substring_regex', 'succeedsblob', 'sum',
            'symmetric', 'system', 'system_time', 'system_user', 'table', 'tables',
            'tablesample', 'temporary', 'text', 'then', 'time', 'timestamp',
            'timezone_hour', 'timezone_minute', 'to', 'token_filters', 'tokenizer',
            'trailing', 'transaction', 'transient', 'translate', 'translate_regex',
            'translation', 'treat', 'trigger', 'trim', 'trim_array', 'true',
            'truncate', 'try_cast', 'type', 'uescape', 'unbounded', 'under', 'undo',
            'union', 'unique', 'unknown', 'unnest', 'until', 'update', 'upper',
            'usage', 'user', 'using', 'value', 'value_of', 'values', 'var_pop',
            'var_samp', 'varbinary', 'varchar', 'varying', 'versioning', 'view',
            'when', 'whenever', 'where', 'while', 'width_bucket', 'window', 'with',
            'within', 'without', 'work', 'write', 'year', 'zone'
        ]),
          operatorChars: /^[*+\-%<>!=~]/,
        });

        var editor = CodeMirror.fromTextArea(input, {
          mode: attrs.mimeType,
          theme: attrs.theme,
          lineWrapping: true
        });

        function updateStatementOnUrlSearch() {
          if ($location.search().query) {
            editor.setValue($location.search().query);
            $console.updateStatement($location.search().query);
          }
        }
        updateStatementOnUrlSearch();

        $scope.$on('$routeUpdate', updateStatementOnUrlSearch.bind(this));

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
  .directive('lazyLoadScroll', function () {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var e = element[0];
        $(window).scroll(function () {
          if (this.pageYOffset + this.innerHeight > e.scrollHeight) {
              scope.$apply(attrs.lazyLoadScroll);
          }
        });
      }
    };
  })
  .directive('formattedArray', function (ObjectTypeCheck) {
    return {
      restrict: 'E',
      scope: {
        array: '=',
        typesarray: '=',
        expand: '='
      },
      templateUrl: 'views/formatted-array-template.html',
      link: function(scope) {

        scope.isExpanded = scope.expand;

        scope.ObjectTypeCheck = ObjectTypeCheck;

        scope.getArrayLength = function getArrayLength() {
          return scope.array.length;
        };

        scope.formatArrayindex = function formatArrayIndex(index) {
          return index + 1;
        };

        scope.getArrayType = function getArrayType() {
          return scope.typesarray[0] == 101 ? 'Set' : 'Array';
        };

        scope.toggleExpand = function toggleExpand() {
          scope.isExpanded = !scope.isExpanded;
        };
      }
    };
  })
  .directive('formattedObject', function (ObjectTypeCheck) {
    return {
      restrict: 'E',
      scope: {
        object: '=',
        expand: '='
      },
      templateUrl: 'views/formatted-object-template.html',
      link: function(scope) {

        scope.isExpanded = scope.expand;

        scope.ObjectTypeCheck = ObjectTypeCheck;

        scope.getKeys = function getKeys() {
          return Object.keys(scope.object);
        };

        scope.getField = function getField(key) {
          return scope.object[key];
        };

        scope.toggleExpand = function toggleExpand() {
          scope.isExpanded = !scope.isExpanded;
        };
      }
    };
  })
  .controller('ConsoleController', function() {
  });
