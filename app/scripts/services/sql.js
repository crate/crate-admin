'use strict';

angular.module('sql', [])
  .factory('queryResultToObjects', function (_object) {
    return function queryResultToObjects(sqlQuery, headers) {
      return $.map(sqlQuery.rows, function(obj, idx){
        return _object(headers, obj);
      });
    };
  })
  .factory('_object', function () {
    return function _object(headers, row) {
      if (headers.length != row.length) return {};
      var obj = {};
      for (var i=0; i<headers.length; i++) {
        obj[headers[i]] = row[i];
      }
      return obj;
    };
  })
  .factory('SQLQuery', function ($http, $location, $log, $q) {
    function SQLQuery(stmt, response, error) {
      this.stmt = stmt;
      this.rows = [];
      this.cols = [];
      this.rowCount = 0;
      this.duration = 0;
      this.error = error;
      this.failed = false;

      if (!this.error && response) {
        this.rows = response.rows;
        this.cols = response.cols;
        this.rowCount = response.rowcount;
        this.duration = response.duration;
      } else {
        this.failed = true;
      }
    }

    SQLQuery.prototype.status = function() {
      var status_string = "";
      var stmt_parts = this.stmt.split(' ');
      var cmd = stmt_parts[0].toUpperCase();
      if (cmd in {'CREATE':'', 'DROP':''}) {
        cmd = cmd + " " + stmt_parts[1].toUpperCase();
      }

      if (this.failed == false) {
        status_string = cmd + " OK (" + (this.duration/1000).toFixed(3) + " sec)";
        $log.info("Query status: " + status_string);
      } else {
        status_string = cmd + " ERROR (" + (this.duration/1000).toFixed(3) + " sec)";
        $log.warn("Query status: " + status_string);
      }

      return status_string;
    };


    SQLQuery.execute = function(stmt, args) {
      var data = {'stmt': stmt};
      if (args != undefined) {
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

      var baseURI = $location.protocol() + "://" + $location.host() + ":" + $location.port();
      if (localStorage.getItem("crate.base_uri") != null) {
        baseURI = localStorage.getItem("crate.base_uri");
      }
      $http.post(baseURI+"/_sql", data, {'timeout': canceler.promise}).
        success(function(data, status, headers, config) {
          deferred.resolve(new SQLQuery(stmt, data, null));
        }).
        error(function(data, status, headers, config) {
          var error = null;
          if (status >= 400 && data.error) {
            error = new Error(data.error.message);
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
