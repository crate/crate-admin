'use strict';

const sql = angular.module('sql', [])
  .factory('queryResultToObjects', function() {
    var toObject = function(headers, row) {
      var obj = {};
      if (headers.length == row.length) {
        for (var i = 0; i < headers.length; i++) {
          obj[headers[i]] = row[i];
        }
      }
      return obj;
    };
    return function(sqlQuery, headers) {
      return sqlQuery.rows.map(function(obj) {
        return toObject(headers, obj);
      });
    };
  })
  .factory('baseURI', function() {
    var baseURI = {};

    baseURI.getWindowLocation = function() {
      return window.location;
    };
    baseURI.getURI = function(path) {
      var basePath;
      var loc = baseURI.getWindowLocation();
      var uriParam = loc.search.match(/([\?|&])base_uri=([^&]+)/);
      if (!uriParam) {
        basePath = loc.protocol + '//' + loc.host + loc.pathname;
      } else {
        basePath = uriParam[2];
      }
      // remove trailing slash from base path and append path
      return basePath.replace(/\/+$/, '') + path;
    };

    return baseURI;
  })
  .factory('SQLQuery', function($http, $q, $log, baseURI, $location, $state, $filter) {
    function SQLQuery(stmt, response, error) {
      this.stmt = stmt;
      this.rows = [];
      this.cols = [];
      this.col_types = [];
      this.rowCount = 0;
      this.duration = 0;
      this.error = error;
      this.failed = false;

      if (!this.error && response) {
        this.rows = response.rows;
        this.cols = response.cols;
        this.col_types = response.col_types === undefined ? [] : response.col_types;
        this.rowCount = response.rowcount;
        this.duration = response.duration;
      } else {
        this.failed = true;
      }
    }

    var translate = $filter('translate');
    SQLQuery.prototype.status = function() {
      var status_string = '';
      var stmt_parts = this.stmt.split(' ');
      var cmd = stmt_parts[0].toUpperCase();
      if (cmd in {
          'CREATE': '',
          'DROP': ''
        }) {
        cmd = cmd + ' ' + stmt_parts[1].toUpperCase();
      }

      var duration = (this.duration / 1000).toFixed(3);
      if (this.failed === false) {
        var subject = this.rowCount === 1 ? translate('CONSOLE.RECORD') : translate('CONSOLE.RECORDS');
        var verb;
        if (cmd === 'SELECT') {
          verb = translate('CONSOLE.RETURNED');
        } else {
          verb = translate('CONSOLE.AFFECTED');
        }
        status_string = `${cmd} OK, ${this.rowCount} ${subject} ${verb} (${duration} ${translate('CONSOLE.SECONDS')})`;

        $log.info('Query status: ' + status_string);
      } else {
        status_string = `${cmd} ${translate('CONSOLE.ERROR')} (${duration} ${translate('CONSOLE.SECONDS')})`;
        $log.warn('Query status: ' + status_string);
      }

      return status_string;
    };


    SQLQuery.execute = function(stmt, args, errorTrace, getTypes, isConsole, cache) {
      var data = {
        'stmt': stmt
      };

      if (!$.isEmptyObject(args)) {
        data.args = args;
      }

      var canceler = $q.defer();
      var deferred = $q.defer();
      var promise = deferred.promise;

      promise.success = function(fn) {
        promise.then(function(sqlQuery) {
          fn(sqlQuery);
        });
        return promise;
      };

      promise.error = function(fn) {
        promise.then(null, function(sqlQuery) {
          fn(sqlQuery);
        });
        return promise;
      };

      promise.cancel = function() {
        canceler.reject();
      };

      var request = {
        url: baseURI.getURI('/_sql' + (getTypes ? '?types' : '')),
        method: 'POST',
        data: data,
        cache: cache,
        config: {
          'timeout': canceler.promise
        }
      };

      if (errorTrace === true) {
        request.params = {
          'error_trace': errorTrace
        };
      }

      $http(request)
        .then(function(response) {
          deferred.resolve(new SQLQuery(stmt, response.data, null));
        }, function(response) {
          var error = null;
          if (response.status >= 400 && response.data.error) {
            error = new Error(response.data.error.message);
            error.error_trace = response.data.error_trace;
            error.status = response.data.error.code;
            if (response.data.error.code === 4011 && !isConsole) {
              $state.go('unauthorized');
            }
          } else if (response.status >= 400) {
            error = new Error(response);
            error.status = response.status;
          } else if (status === 0) {
            error = new Error('Connection refused');
            error.status = response.status;
          }

          deferred.reject(new SQLQuery(stmt, data, error));
        });
      return promise;
    };

    return SQLQuery;
  });
export default sql;
