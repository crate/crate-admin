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
    function SQLQuery(stmt, response, failed) {
      this.stmt = stmt;
      this.rows = [];
      this.cols = [];
      this.rowCount = [];
      this.duration = 0;
      this.error = {'message':'', code:0};
      this.failed = failed;

      if (this.failed === true || !response || response.error) {
        this.error = response ? response.error : {'message': 'No base_uri specified.', 'code': 0};
      } else {
        this.rows = response.rows;
        this.cols = response.cols;
        this.rowCount = response.rowcount;
        this.duration = response.duration;
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

      var baseURI = $location.protocol() + "://" + $location.host() + ":" + $location.port();
      if (localStorage.getItem("crate.base_uri") != null) {
        baseURI = localStorage.getItem("crate.base_uri");
      }
      $http.post(baseURI+"/_sql", data).
        success(function(data, status, headers, config) {
          deferred.resolve(new SQLQuery(stmt, data, false));
        }).
        error(function(data, status, headers, config) {
          $log.warn("Got ERROR response from query: " + stmt + " with status: " + status);
          if (status == 0) {
            data = {'error': {'message': 'Connection error', 'code':0}};
          }
          deferred.reject(new SQLQuery(stmt, data, true));
        });
      return promise;
    };

    return SQLQuery;
  });
