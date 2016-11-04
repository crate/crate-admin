'use strict';

angular.module('nodeinfo', [])
  .factory('NodeHealth', function(){
    var NodeHealth = function NodeHealth(node) {
      var getStatus = function getStatus(val){
        if (val > NodeHealth.THRESHOLD_CRITICAL) return 2;
        if (val > NodeHealth.THRESHOLD_WARNING) return 1;
        return 0;
      };
      var value = Math.max(node.fs.used_percent, node.heap.used_percent);
      var status = getStatus(value);
      this.value = status;
      this.status = ['good','warning','critical'][status];
    };
    NodeHealth.THRESHOLD_CRITICAL = 98;
    NodeHealth.THRESHOLD_WARNING = 90;
    return NodeHealth;
  })
  .factory('NodeInfo', ['SQLQuery', 'queryResultToObjects', '$q',
    function (SQLQuery, queryResultToObjects, $q) {
      var nodeInfo = {
        deferred: $q.defer()
      };

      var nodeQuery = "SELECT id, name, hostname, rest_url, port, heap, fs, " +
        "os['cpu'], load, version, os['probe_timestamp'], process['cpu'], " +
        "os_info['available_processors'] FROM sys.nodes ORDER BY id";
      var nodeCols = ['id', 'name', 'hostname', 'rest_url', 'port', 'heap', 'fs',
        'cpu', 'load', 'version', 'timestamp', 'proc_cpu', 'num_cores'];
      nodeInfo.executeNodeQuery = function() {
        var d = $q.defer();
        SQLQuery.execute(nodeQuery).success(function(sqlQuery){
          var response = queryResultToObjects(sqlQuery, nodeCols);
          d.resolve(response);
        }).error(function(){
          d.reject();
        })
        return d.promise;
      };

      var clusterQuery = 'select name, master_node from sys.cluster';
      var clusterCols = ['name', 'master_node'];
      nodeInfo.executeClusterQuery = function(){
        var d = $q.defer();
        SQLQuery.execute(clusterQuery).success(function(sqlQuery){
          d.resolve(queryResultToObjects(sqlQuery, clusterCols));
        }).error(function(){
          d.reject();
        })
        return d.promise;
      };

      return nodeInfo;
    }
  ])
  .provider('NodeListInfo', function() {
    var sortInfo = {
      sort: {
        'col': ['health_value', 'name'],
        'desc': false
      },
      sortBy: function(col) {
        if (this.sort.col.indexOf(col) === 0) {
          this.sort.desc = !this.sort.desc;
        } else {
          this.sort.col = this.sort.col.reverse();
          this.sort.desc = false;
        }
      },
      sortClass: function(col) {
        if (this.sort.col.indexOf(col) === 0) {
          return this.sort.desc ? 'fa fa-caret-down' : 'fa fa-caret-up';
        } else {
          return '';
        }
      }
    };
    this.$get = function() {
      return sortInfo;
    };
  })
  .factory('prepareNodeList', function(NodeHealth){
    var colorMapLabel = {
      "good": 'label-success',
      "warning": 'label-warning',
      "critical": 'label-danger',
      '--': ''
    };
    return function prepareNodeList(cluster, master_node) {
      var nodeList = [];
      for (var i=0; i<cluster.length; i++) {
        var node = angular.copy(cluster[i]);
        node.health = new NodeHealth(node);
        node.health_value = node.health.value;
        node.health_label_class = colorMapLabel[node.health.status];
        node.health_panel_class = colorMapLabel[node.health.status];
        node.heap.used_percent = node.heap.used * 100 / node.heap.max;
        node.heap.free_percent = 100.0 - node.heap.used_percent;
        node.master_node = node.id === master_node;
        nodeList.push(node);
      }
      return nodeList;
    };
  })
  .factory('compareByHealth', function(){
    return function compareByHealth(a,b) {
      if (a.health.value < b.health.value) return -1;
      if (a.health.value > b.health.value) return 1;
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    };
  });
