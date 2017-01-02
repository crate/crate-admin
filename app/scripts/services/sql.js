'use strict';

angular.module('sql', [])
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
    var pluginPathDeprecated = '/_plugin/crate-admin/';
    var pluginPath = '/admin/';

    var baseURI = {};

    baseURI.getWindowLocation = function() {
      return window.location;
    };
    baseURI.getURI = function(path) {
      var basePath;
      var loc = baseURI.getWindowLocation();
      var uriParam = loc.search.match(/([\?|&])base_uri=([^&]+)/);
      if (!uriParam) {
        basePath = loc.protocol + '//' +
          loc.host +
          loc.pathname.replace(pluginPath, '').replace(pluginPathDeprecated, '');
      } else {
        basePath = uriParam[2];
      }
      // remove trailing slash from base path and append path
      return basePath.replace(/\/+$/, '') + path;
    };

    return baseURI;
  })
  .factory('SQLQuery', function($http, $q, $log, baseURI) {
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
        this.col_types = response.col_types;
        this.rowCount = response.rowcount;
        this.duration = response.duration;
      } else {
        this.failed = true;
      }
    }

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

      if (this.failed === false) {
        status_string = cmd + ' OK (' + (this.duration / 1000).toFixed(3) + ' sec)';
        $log.info('Query status: ' + status_string);
      } else {
        status_string = cmd + ' ERROR (' + (this.duration / 1000).toFixed(3) + ' sec)';
        $log.warn('Query status: ' + status_string);
      }

      return status_string;
    };


    SQLQuery.execute = function(stmt, args, errorTrace, getTypes) {
      var data = {
        'stmt': stmt
      };

      if (args !== undefined && !$.isEmptyObject(args)) {
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
        .success(function(data) {
          deferred.resolve(new SQLQuery(stmt, data, null));
        })
        .error(function(data, status) {
          var error = null;
          if (status >= 400 && data.error) {
            error = new Error(data.error.message);
            error.error_trace = data.error_trace;
            error.status = data.error.status;
          } else if (status >= 400) {
            error = new Error(data);
            error.status = status;
          } else if (status === 0) {
            error = new Error('Connection refused');
            error.status = status;
          }
          deferred.reject(new SQLQuery(stmt, data, error));
        });
      return promise;
    };

    return SQLQuery;
  });