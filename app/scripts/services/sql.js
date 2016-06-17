'use strict';

angular.module('sql', [])
  .factory('queryResultToObjects', function(row2obj) {
    return (sqlQuery, cols) => {
      return sqlQuery.rows.map((o, idx) => row2obj(cols, o));
    };
  })
  .factory('row2obj', function() {
    return (cols, row) => {
      if (cols.length != row.length) return {};
      let obj = {};
      for (let i=0; i<cols.length; i++) {
        obj[cols[i]] = row[i];
      }
      return obj;
    };
  })
  .factory('baseURI', function($location){
    return function baseURI(path) {
      var basePath = localStorage.getItem("crate.base_uri");
      if (!basePath) {
        var pluginPath = '/_plugin/crate-admin/';
        basePath = $location.protocol() + "://" +
                   $location.host() + ":" +
                   $location.port() +
                   window.location.pathname.replace(pluginPath, '');
      }
      return basePath + path;
    };
  })
  .factory('SQLQuery', function($http, $location, $log, $q, baseURI) {
    class SQLQuery {

      constructor(stmt, response, error) {
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

      status() {
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
      }

      static execute(stmt, args) {
        var data = {'stmt': stmt};
        if (args != undefined) {
          data.args = args;
        }

        var canceler = $q.defer();
        var deferred = $q.defer();
        var promise = deferred.promise;

        promise.success = (fn) => {
          promise.then(fn, null, null);
          return promise;
        };

        promise.error = (fn) => {
          promise.then(null, fn, null);
          return promise;
        };

        promise.cancel = canceler.reject;

        $http.post(baseURI("/_sql"), data, {'timeout': canceler.promise})
          .success((data, status, headers, config) => {
            deferred.resolve(new SQLQuery(stmt, data, null));
          })
          .error((data, status, headers, config) => {
            let error = null;
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

    }

    return SQLQuery;
  });
