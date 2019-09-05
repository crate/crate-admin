'use strict';

angular.module('export', ['sql', 'translation'])
  .controller('ExportController', function() {})
  .directive('export', function(SQLQuery, queryResultToObjects, ConsoleFormatting){
    return {
      restrict: 'A',
      controller: ['$scope' , function($scope) {
        $scope.supportedFormats = [
          { id: 'json' },
          { id: 'csv' },
          { id: 'csv-flat' },
        ]
        $scope.selectedFormat = $scope.supportedFormats[0]
        $scope.loading = false
        $scope.error = {
          hide: true,
          message: '',
          error_trace:''
        };
        $scope.queryStatusClass = ConsoleFormatting.queryStatusClass;

        var statement = ''
        var utils = {
          getDataType: function (col, type) {
            if (col === null) {
              return 'null';
            } else if (Array.isArray(type)) {
              return 'array';
            } else {
              switch (type) {
              case 2: // Byte
              case 6: // Double
              case 7: // Float
              case 8: // Short
              case 9: // Integer
              case 10: // Long
                return 'number';
              case 4: // String
              case 5: // IP
                return 'string';
              case 3: // Boolean
                return 'boolean';
              case 11: // Timestamp
                return 'timestamp';
              case 12: // Object
                return 'object';
              case 13: // Geopoint
                return 'geo_point';
              case 14: // Geoshape
                return 'geo_shape';
              }
            }
          },
          arrayFrom: function (json) {
            var queue = [], next = json;
            while (next !== undefined) {
                if ($.type(next) == "array") {
        
                    // but don't if it's just empty, or an array of scalars
                    if (next.length > 0) {
        
                      var type = $.type(next[0]);
                      var scalar = (type == "number" || type == "string" || type == "boolean" || type == "null");
        
                      if (!scalar)
                        return next;
                    }
                } if ($.type(next) == "object") {
                  for (var key in next)
                    queue.push(next[key]);
                }
                next = queue.shift();
            }
            // none found, consider the whole object a row
            return [json];
          },
          flattenObject: function (obj, path) {
            if (path == undefined)
                path = "";
        
            var type = $.type(obj);
            var scalar = (type == "number" || type == "string" || type == "boolean" || type == "null");
        
            if (type == "array" || type == "object") {
                var d = {};
                for (var i in obj) {
        
                    var newD = utils.flattenObject(obj[i], path + i + "/");
                    $.extend(d, newD);
                }
        
                return d;
            }
        
            else if (scalar) {
                var d = {};
                var endPath = path.substr(0, path.length-1);
                d[endPath] = obj;
                return d;
            }
        
            // ?
            else return {};
          },
          saveFile: function (name, type, data) {
            if (data !== null && navigator.msSaveBlob)
                return navigator.msSaveBlob(new Blob([data], { type: type }), name);
            var a = $("<a style='display: none;'/>");
            var url = window.URL.createObjectURL(new Blob([data], {type: type}));
            a.attr("href", url);
            a.attr("download", name);
            $("body").append(a);
            a[0].click();
            window.URL.revokeObjectURL(url);
            a.remove();
          },
          cleanSQL: function (sql) { 
            var stmt = sql.replace(/^\s+|\s+$/g, '');
      
            if (stmt === '') { return; }
            stmt = stmt.replace(/([^;]);+$/, '$1');
            if (stmt.match(/^\s*select\s/ig) && !stmt.match(/limit\s+\d+/ig)) {
              stmt += ' limit 100';
            }
      
            return stmt;
          },
          exportToFormat: function (format, queryResponse) {
            switch (format.id) {
              case 'json':
                var objs = queryResultToObjects(queryResponse, queryResponse.cols);
                utils.saveFile('export.json', 'application/json', JSON.stringify(objs));
                break;
              case 'csv':
                var separator = ',';
                var linebreak = '\r\n';
                var output = '';
                // Header
                output += queryResponse.cols.join(separator) + linebreak;
                // Data
                queryResponse.rows.forEach((row, index) => {
                  var last = index === queryResponse.rows.length - 1;

                  row.forEach((column, index) => {
                    var last = index === row.length - 1;
                    var type = utils.getDataType(column, queryResponse.col_types[index]);

                    switch (type) {
                      case 'object':
                      case 'array':
                        // Stringify twice to escape the output
                        output += JSON.stringify((JSON.stringify(column)));
                        break;
                      default:
                        output += column;
                    }

                    if (!last) { output += separator; }
                  })

                  if (!last) { output += linebreak; }
                })
                utils.saveFile('export.csv', 'text/csv', output);
                break;
              case 'csv-flat':
                // Parts borrowed from https://github.com/konklone/json
                var objs = queryResultToObjects(queryResponse, queryResponse.cols);
                var inArray = utils.arrayFrom(objs);
                var outArray = [];
                for (var row in inArray)
                    outArray[outArray.length] = utils.flattenObject(inArray[row]);
                var output = window.csv.fromObjects(outArray);
                utils.saveFile('export.csv', 'text/csv', output);
                break;
            }
          }
        };

        $scope.export = function(){
          var format = $scope.selectedFormat;
          var sql = statement;

          var stmt = utils.cleanSQL(sql);
          if ($scope.loading || stmt == null) { return; }

          $scope.loading = true;
          SQLQuery.execute(stmt, {}, false, true, true, false)
          .then(function(response) {
            $scope.loading = false;
            $scope.error.hide = true;
            $scope.error.message = '';
            $scope.error.error_trace = '';
            $scope.status = response.status();

            utils.exportToFormat(format, response);
          }, function (response) {
            $scope.loading = false;
            $scope.error.hide = false;
            $scope.error = response.error;
            $scope.status = response.status();
          });
        };

        this.updateStatement = function(sql) {
          statement = sql || '';
        };
        this.export = function() {
          $scope.export();
        }
      }]
    };
  })
  .directive('cliexport', function(KeywordObjectCreator, $location){
    return {
      restrict: 'E',
      transclude: true,
      templateUrl: 'static/views/editor.html',
      scope: {},
      require: '^export',
      link: function($scope, element, attrs, $export) {
        var statement = $location.search().query || '';
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
            $export.updateStatement($location.search().query);
          }
        }
        updateStatementOnUrlSearch();
        $scope.$on('$stateChangeStart', updateStatementOnUrlSearch.bind(this));

        // input change event
        editor.on('change', function(instance){
          statement = instance.getValue();
          $export.updateStatement(statement);
        });

        // key down event
        editor.on('keydown', function(instance, event){
          if (event.keyCode === 13 && !!event.shiftKey) {
            // SHIFT + ENTER KEY
              event.preventDefault();
              $export.export();
          }
        });
      }
    };
  })
  .run(function(NavigationService, $translatePartialLoader, $filter, $rootScope, $translate) {
    $translatePartialLoader.addPart('./static/plugins/export');
    $translate.refresh();
    var iconSrc = 'static/plugins/export/static/icons/icon-export.png';
    var url = '/export';
    var position = 101;

    NavigationService.addNavBarElement(iconSrc, $filter('translate', 'NAVIGATION.EXPORT'), url, position, "export");

    // Update Navbar Elements if Language Changes
    $rootScope.$on('$translateChangeSuccess', function() {
      $translate('NAVIGATION.EXPORT').then(function(translation) {
        NavigationService.updateNavBarElement(url, translation);
      });
    });
  });
