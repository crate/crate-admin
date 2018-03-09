'use strict';
import './sql';

const nodeinfo = angular.module('nodeinfo', ['sql'])
  .factory('NodeHealth', function () {
    var state = function (val) {
      if (val > 98) {
        return 2;
      } else if (val > 90) {
        return 1;
      }
      return 0;
    };
    return function (node) {
      const fs_used_percent = node.fs ? node.fs.used_percent : 0;
      const heap_used_percent = node.heap ? node.heap.used_percent : 0;
      if (fs_used_percent === 0 && heap_used_percent === 0) {
        this.status = 'unreacheable'; 
      } else {
        this.value = state(Math.max(fs_used_percent, heap_used_percent));
        this.status = ['good', 'warning', 'critical'][this.value];
      }
    };
  })
  .factory('NodeInfo', function (SQLQuery, queryResultToObjects, $q) {
    var nodeInfo = {
      deferred: $q.defer()
    };

    var nodeQuery = 'SELECT id, name, hostname, rest_url, port, heap, fs, ' +
      'os[\'cpu\'], load, version, os[\'probe_timestamp\'], process[\'cpu\'], ' +
      'os_info[\'available_processors\'] FROM sys.nodes ORDER BY id';
    var nodeCols = ['id', 'name', 'hostname', 'rest_url', 'port', 'heap', 'fs',
      'cpu', 'load', 'version', 'timestamp', 'proc_cpu', 'num_cores'];
    nodeInfo.executeNodeQuery = function () {
      var d = $q.defer();
      SQLQuery.execute(nodeQuery, {}, false, false, false, false).success(function (sqlQuery) {
        var response = queryResultToObjects(sqlQuery, nodeCols);
        d.resolve(response);
      }).error(function () {
        d.reject();
      });
      return d.promise;
    };

    var clusterQuery = 'select name, master_node from sys.cluster';
    var clusterCols = ['name', 'master_node'];
    nodeInfo.executeClusterQuery = function () {
      var d = $q.defer();
      SQLQuery.execute(clusterQuery, {}, false, false, false, false).success(function (sqlQuery) {
        d.resolve(queryResultToObjects(sqlQuery, clusterCols));
      }).error(function () {
        d.reject();
      });
      return d.promise;
    };

    return nodeInfo;
  })
  .provider('NodeListInfo', function () {
    var sortInfo = {
      sort: {
        'col': ['health_value', 'name'],
        'desc': false
      },
      sortBy: function (col) {
        if (this.sort.col.indexOf(col) === 0) {
          this.sort.desc = !this.sort.desc;
        } else {
          this.sort.col = this.sort.col.reverse();
          this.sort.desc = false;
        }
      },
      sortClass: function (col) {
        if (this.sort.col.indexOf(col) === 0) {
          return this.sort.desc ? 'fa fa-caret-down' : 'fa fa-caret-up';
        } else {
          return '';
        }
      }
    };
    this.$get = function () {
      return sortInfo;
    };
  })
  .factory('prepareNodeList', function (NodeHealth) {
    var LABEL_COLOR_MAP = {
      good: 'label-success',
      warning: 'label-warning',
      critical: 'label-danger',
      unreacheable: 'label-default',
      '--': ''
    };
    return function (cluster, master_node) {
      var nodeList = [];
      for (var i = 0; i < cluster.length; i++) {
        var node = angular.copy(cluster[i]);

        node.health = new NodeHealth(node);
        node.health_value = node.health.value;

        node.health_label_class = node.health ? LABEL_COLOR_MAP[node.health.status] : LABEL_COLOR_MAP.unreacheable;
        node.health_panel_class = node.health ? LABEL_COLOR_MAP[node.health.status] : LABEL_COLOR_MAP.unreacheable;

        if (node.heap) {
          node.heap.used_percent = node.heap.used * 100 / node.heap.max;
          node.heap.free_percent = 100.0 - node.heap.used_percent;
        } else {
          node.heap = {};
          node.heap.used_percent = 0;
          node.heap.free_percent = 100.0;
        }

        node.master_node = node.id === master_node;
        nodeList.push(node);
      }
      return nodeList;
    };
  })
  .factory('compareByHealth', function () {
    return function (a, b) {
      if (a.health.value < b.health.value) {
        return -1;
      } else if (a.health.value > b.health.value) {
        return 1;
      } else if (a.name < b.name) {
        return -1;
      } else if (a.name > b.name) {
        return 1;
      }
      return 0;
    };
  });

export default nodeinfo;
