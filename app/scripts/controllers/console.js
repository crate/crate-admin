'use strict';

import '../services/sql';
import '../services/datatypechecks';
import '../services/stats';

const crate_console = angular.module('console', ['sql', 'datatypechecks', 'stats'])
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
  .service('ConsoleFormatting', function () {
    return {
      queryStatusClass: function (status) {
        if (status === undefined) {
          return '';
        }
        if (status.indexOf('OK') !== -1) {
          return 'query-status--ok';
        }
        if (status.indexOf('ERROR') !== -1) {
          return 'query-status--error';
        }
        return '';
      }
    };
  })
  .service('ConsoleState', function () {
    var state = {};
    var service = {};

    service.save = function (consoleState) {
        state = consoleState;
      };

    service.restore = function() {
        return state;
      };

    return service;
  })
  .directive('console', function(SQLQuery, ColumnTypeCheck, ConsoleFormatting, ClusterState){
    return {
      restrict: 'A',
      controller: ['$scope', '$rootScope', '$translate', '$location', 'Clipboard', '$timeout' , function($scope, $rootScope, $translate, $location, Clipboard, $timeout){
        var self = this;

        $timeout(function(){
          $('#cr-console-query').attr('tabindex',-1).focus();
        }, 500);

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

        $scope.pageSize = 50;
        $scope.startIndex = 0;
        $scope.page = 1;
        $scope.numberOfPages = 1;
        $scope.endIndex = $scope.startIndex + $scope.pageSize;

        function scrollTop() {
          var top = $('.query-result-container').position().top;
          $('html,body').animate({scrollTop: top}, 500 );
        }

        $scope.next = function () {
          $rootScope.$broadcast('console-pagination');
          safeApply($scope, function () {
            if ($scope.startIndex >= $scope.rows.length ||
                $scope.startIndex + $scope.pageSize >= $scope.rows.length) {
              return;
            }
            $scope.paginated_formatted_rows = [];
            $scope.paginated_formatted_rows = [];
            $scope.startIndex = $scope.startIndex + $scope.pageSize;
            $scope.endIndex = $scope.endIndex + $scope.pageSize;
            if ($scope.endIndex > $scope.rows.length) {
              $scope.endIndex = $scope.rows.length;
            }
            $scope.paginated_formatted_rows = $scope.formatted_rows.slice($scope.startIndex, $scope.endIndex);
            $scope.paginated_rows = $scope.rows.slice($scope.startIndex, $scope.endIndex);
            $scope.page += 1;
            scrollTop();
          });
        };

        $scope.previous = function () {
          $rootScope.$broadcast('console-pagination');
          safeApply($scope, function () {
            $scope.paginated_formatted_rows = [];
            $scope.paginated_formatted_rows = [];

            if ($scope.startIndex === $scope.rows.length) {
              $scope.startIndex = $scope.startIndex - $scope.pageSize;
            } else {
              $scope.startIndex = $scope.startIndex - $scope.pageSize;
              $scope.endIndex = $scope.startIndex + $scope.pageSize;
              if ($scope.startIndex <= 0) {
                $scope.startIndex = 0;
                $scope.endIndex = $scope.startIndex + $scope.pageSize;
              }
            }
            $scope.paginated_formatted_rows = $scope.formatted_rows.slice($scope.startIndex, $scope.endIndex);
            $scope.paginated_rows = $scope.rows.slice($scope.startIndex, $scope.endIndex);

            if ($scope.page <= 1) {
              $scope.page = 1;
            } else {
              $scope.page += -1;
            }
            scrollTop();
          });
        };

        function safeApply(scope, fn) {
          if (scope && scope.$root) {
            var phase = scope.$root.$$phase;
            if (phase == '$apply' || phase == '$digest') {
              scope.$eval(fn);
            } else {
              scope.$apply(fn);
            }
          }
        }

        $('body').keydown(function (e) {
          if ($(e.target).is('textarea')) {
            return;
          }
          var keyCode = e.keyCode;

          if (keyCode === 39) {
              $scope.next();
              $('#next').attr('tabindex',-1).focus();
          } else if (keyCode === 37) {
              $scope.previous();
              $('#previous').attr('tabindex',-1).focus();
          }
        });

        $scope.queryStatusClass = ConsoleFormatting.queryStatusClass;

        $scope.urlEncodedJson = function(json) {
          return encodeURIComponent(JSON.stringify(json));
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

        var doStoreQueries = localStorage.getItem('crate.console.store_queries') || '1';
        $scope.useLocalStorage = !!parseInt(doStoreQueries);
        getRecentQueriesFromLocalStorage();

        function getDataType(col, type) {
          if (col === null) {
            return 'null';
          } else if (Array.isArray(type)) {
            return 'array';
          } else {
            switch (type) {
              // Byte
            case 2:
              // Double
            case 6:
              // Float
            case 7:
              // Short
            case 8:
              // Integer
            case 9:
              // Long
            case 10:
              return 'number';

              // String
            case 4:
              // IP
            case 5:
              return 'string';

              // Boolean
            case 3:
              return 'boolean';

              // Timestamp
            case 11:
              return 'timestamp';
            case 12:
              return 'object';
              // Geopoint
            case 13:
              return 'geo_point';
                // Geoshape
            case 14:
              return 'geo_shape';
            }
          }

        }

        function formatData() {
          $scope.formatted_rows = [];
          if ($scope.rows) {
            for (var i = 0; i < $scope.rows.length; i++) {
              var row = $scope.rows[i];
              for (var j = 0; j < row.length; j++) {
                //check each column type.
                var col = row[j];
                var dataType = getDataType(col, $scope.resultHeaderTypes[j]);
                if (!$scope.formatted_rows[i]) {
                  $scope.formatted_rows[i] = [];
                }

                $scope.formatted_rows[i].push({
                  value: col,
                  type: dataType
                });
              }
            }
          }
          $scope.paginated_formatted_rows = $scope.formatted_rows.slice($scope.startIndex, $scope.endIndex);
        }

        self.execute = function(sql) {
          $scope.startIndex = 0;
          $scope.page = 1;
          $scope.numberOfPages = 1;
          $scope.endIndex = $scope.startIndex + $scope.pageSize;
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
          SQLQuery.execute(stmt, {} , $scope.showErrorTrace, true, true, false)
          .then(function(response) {
            $scope.loading = false;
            $scope.error.hide = true;
            $scope.error.message = '';
            $scope.error.error_trace = '';
            $scope.info.hide = true;
            $scope.info.message = '';
            $scope.renderTable = true;

            $scope.resultHeaders = [];
            for (var i = 0; i < response.cols.length; i++) {
              $scope.resultHeaders.push(response.cols[i]);
            }

              $scope.resultHeaderTypes = [];
              for (i = 0; i < response.col_types.length; i++) {
                $scope.resultHeaderTypes.push(response.col_types[i]);
              }

              $scope.rows = response.rows;
              $scope.limitToAmount = 0;
              $scope.status = response.status();
              $scope.statement = stmt + ';';
              inputScope.updateInput($scope.statement);
              formatData();
              $scope.paginated_rows = $scope.rows.slice($scope.startIndex, $scope.endIndex);
              $scope.numberOfPages = Math.ceil($scope.rows.length / $scope.pageSize);
              //refresh cluster state
              ClusterState.refresh();
            },function (response) {
              $scope.loading = false;
              $scope.error.hide = false;
              $scope.renderTable = false;
              $scope.error = response.error;

              if (!$scope.showErrorTrace && !displayedErrorTraceHint) {
                displayedErrorTraceHint = true;
                localStorage.setItem('crate.console.displayed_error_trace_hint', '1');
              }

            $scope.status = response.status();
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
          $('#cr-console-query').attr('tabindex',-1).focus();
        };

        $scope.share = function () {
          if (statement) {
            $location.search('query', statement);
            Clipboard.copy($location.absUrl());
          }
        };
      }]
    };
  })
  .directive('cli', function($timeout, KeywordObjectCreator, $location, ConsoleState, $transitions){
    return {
      restrict: 'E',
      transclude: true,
      templateUrl: 'static/views/editor.html',
      scope: {
      },
      require: '^console',
      link: function($scope, element, attrs, $console) {

        var statement = $location.search().query || '';
        var typedStatement = $location.search().query || '';
        var input = $('textarea',element)[0];

        window.CodeMirror.defineMIME('text/x-cratedb', {
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

        var editor = window.CodeMirror.fromTextArea(input, {
          mode: 'text/x-cratedb',
          theme: 'monokai',
          lineWrapping: true,
          // indent using spaces
          indentWithTabs: false,
          indentUnit: 2,
          tabSize: 2
        });

        // map the Tab key to insert spaces instead of a tab character
        editor.setOption('extraKeys', {
          Tab: function (cm) {
            var spaces = ' '.repeat(cm.getOption('indentUnit'));
            cm.replaceSelection(spaces);
          }
        });

        function updateStatementOnUrlSearch() {
          if ($location.search().query) {
            editor.setValue($location.search().query);
            $console.updateStatement($location.search().query);
          }
        }

        if (statement === '' && ConsoleState.restore().stmt) {
          //restore statement when the console view is reloaded
          var stmt = ConsoleState.restore().stmt;
          editor.setValue(stmt);
          $console.updateStatement(stmt);
        }

        updateStatementOnUrlSearch();

        $scope.$on('$stateChangeStart', updateStatementOnUrlSearch.bind(this));

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

        $transitions.onStart({}, function() {
              // save console state
              var state = {};
              state.stmt = editor.getValue();
              ConsoleState.save(state);
            });
      }
    };
  })
  .directive('formattedArray', function (ObjectTypeCheck) {
    return {
      restrict: 'E',
      scope: {
        array: '=',
        typesarray: '@',
        expand: '@'
      },
      templateUrl: 'static/views/formatted-array-template.html',
      link: function(scope) {
        scope.isExpanded = scope.expand === 'true' ? true : false;
        scope.typesarray = JSON.parse(scope.typesarray);
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
        scope.$on('console-pagination', function() {
          scope.isExpanded = false;
        });
      }
    };
  })
  .directive('formattedObject', function (ObjectTypeCheck) {
    return {
      restrict: 'E',
      scope: {
        object: '=',
        expand: '@'
      },
      templateUrl: 'static/views/formatted-object-template.html',
      link: function(scope) {

        scope.isExpanded = scope.expand === 'true' ? true : false;

        scope.ObjectTypeCheck = ObjectTypeCheck;

        scope.keys = Object.keys(scope.object);

        scope.getField = function getField(key) {
          return scope.object[key];
        };

        scope.toggleExpand = function toggleExpand() {
          scope.isExpanded = !scope.isExpanded;
        };
        scope.$on('console-pagination', function() {
          scope.isExpanded = false;
        });
      }
    };
  })
  .controller('ConsoleController', function() {
  });
export default crate_console;
