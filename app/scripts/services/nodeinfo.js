'use strict';

angular.module('nodeinfo', [])
  .factory('NodeHealth', [
    function(){
      class NodeHealth {
        constructor(node) {
          var value = Math.max(node.fs.used_percent, node.heap.used_percent);
          this.value = this.getStatus(value);
          this.status = ['good', 'warning', 'critical'][this.value];
        }
        getStatus(val) {
          if (val > NodeHealth.THRESHOLD_CRITICAL) return 2;
          if (val > NodeHealth.THRESHOLD_WARNING) return 1;
          return 0;
        }
      }
      NodeHealth.THRESHOLD_CRITICAL = 98;
      NodeHealth.THRESHOLD_WARNING = 90;
      return NodeHealth;
    }
  ])
  .factory('NodeInfo', ['SQLQuery', 'queryResultToObjects', '$q',
    function(SQLQuery, queryResultToObjects, $q) {
      const nodeQuery = "select id, name, hostname, rest_url, port, load, heap, fs, os['cpu'] as cpu, load, version, os['probe_timestamp'] as timestamp, " +
          "process['cpu'] as proc_cpu, os_info['available_processors'] as num_cores " +
          "from sys.nodes";
      const nodeCols = ['id', 'name', 'hostname', 'rest_url', 'port', 'load', 'heap', 'fs', 'cpu', 'load', 'version', 'timestamp', 'proc_cpu', 'num_cores'];

      var nodeInfo = {
        deferred: $q.defer()
      };

      nodeInfo.executeNodeQuery = () => {
        var d = $q.defer();
        SQLQuery.execute(nodeQuery).success((sqlQuery) => {
          let res = queryResultToObjects(sqlQuery, nodeCols);
          d.resolve(res);
        }).error(d.reject);
        return d.promise;
      };

      const clusterQuery = "select name, master_node from sys.cluster";
      const clusterCols = ['name', 'master_node'];

      nodeInfo.executeClusterQuery = () => {
        var d = $q.defer();
        SQLQuery.execute(clusterQuery).success((sqlQuery) => {
          let res = queryResultToObjects(sqlQuery, clusterCols);
          d.resolve(res);
        }).error(d.reject);
        return d.promise;
      };

      return nodeInfo;
    }
  ])
  .provider('NodeListInfo', [
    function() {
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
            return this.sort.desc ? 'fa fa-chevron-down' : 'fa fa-chevron-up';
          } else {
            return '';
          }
        }
      };
      this.$get = function() {
        return sortInfo;
      };
    }
  ])
  .factory('prepareNodeList', ['NodeHealth',
    function(NodeHealth){
      const colorMapLabel = {
        "good": 'label-success',
        "warning": 'label-warning',
        "critical": 'label-danger',
        '--': ''
      };
      return (cluster, master_node) => {
        var nodeList = [];
        for (let i=0; i<cluster.length; i++) {
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
    }
  ])
  .factory('compareByHealth', [
    function() {
      return (a, b) => {
        if (a.health.value < b.health.value) return -1;
        if (a.health.value > b.health.value) return 1;
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      };
    }
  ]);
