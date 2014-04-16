'use strict';

angular.module('cluster', ['stats', 'sql', 'common'])
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
          return this.sort.desc ? 'fa fa-chevron-down' : 'fa fa-chevron-up';
        } else {
          return '';
        }
      }
    };
    this.$get = function() {
      return sortInfo;
    };
  })
  .controller('ClusterController', function ($scope, $interval, $routeParams, $http, $filter, ClusterState, NodeListInfo) {

    $scope.percentageLimitYellow = 90;
    $scope.percentageLimitRed = 98;

    var colorMapLabel = {
      "good": '',
      "warning": 'label-warning',
      "critical": 'label-danger',
      '--': ''
    };

    var NodeHealth = function NodeHealth(node) {
      var getStatus = function getStatus(val){
        if (val > $scope.percentageLimitRed) return 2;
        if (val > $scope.percentageLimitYellow) return 1;
        return 0;
      };
      var value = Math.max(node.fs.used_percent, node.mem.used_percent);
      var status = getStatus(value);
      this.value = status;
      this.status = ['good','warning','critical'][status];
    };

    var selected_node = $routeParams.node_name || '';

    var empty_node = {
      'name': 'Cluster (0 Nodes)',
      'id': '',
      'summary': [],
      'health': '--',
      'health_label_class': '',
      'health_panel_class': '',
      'hostname': '--',
      'address': '--',
      'mem': {
        'total': 0,
        'free': 0,
        'used': 0,
        'used_percent': 0,
        'free_percent': 0
      },
      'fs': {
        'total': 0,
        'free': 0,
        'used': 0,
        'free_percent': 0,
        'used_percent': 0
      }
    };

    var compareListByHealth = function compareListByHealth(a,b) {
      if (a.health.value < b.health.value) return -1;
      if (a.health.value > b.health.value) return 1;
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    };

    $scope.$watch(function() { return ClusterState.data; }, function (data) {
      var cluster = data.cluster;
      var showSidebar = cluster.length > 0;

      $scope.renderSidebar = showSidebar;
      var nodeList = prepareNodeList(cluster);

      if (!showSidebar) {
        // no sidebar
        $scope.node = angular.copy(empty_node);
        $scope.selected_node = '';
      } else {
        // sort nodes by health and hostname
        nodeList = nodeList.sort(compareListByHealth);
        // show sidebar
        var nodeName = $routeParams.node_name;
        var nodeNames = $.map(nodeList, function(obj){
          return obj.name;
        });
        if (nodeName && nodeNames.indexOf(nodeName)>=0) {
          var selectedNode = nodeList.filter(function(node, idx) {
            return node.name == $routeParams.node_name;
          });
          $scope.node = selectedNode.length ? selectedNode[0] : nodeList[0];
          $scope.selected_node = $routeParams.node_name;
        } else {
          $scope.node = nodeList[0];
          $scope.selected_node = nodeList[0].name;
        }
      }
      $scope.nodes = nodeList;
    }, true);

    var prepareNodeList = function prepareNodeList(cluster) {
      var nodeList = [];
      for (var i=0; i<cluster.length; i++) {
        var node = angular.copy(cluster[i]);
        node.address = "http://" + (node.hostname || "localhost") + ":" + node.port.http;
        node.health = new NodeHealth(node);
        node.health_value = node.health.value;
        node.health_label_class = colorMapLabel[node.health.status];
        node.health_panel_class = colorMapLabel[node.health.status];
        node.mem.total = node.mem.used + node.mem.free;
        nodeList.push(node);
      }
      return nodeList;
    };

    $scope.sort = NodeListInfo.sort;
    $scope.sortBy = NodeListInfo.sortBy;
    $scope.sortClass = NodeListInfo.sortClass;

    $scope.isActive = function (node_name) {
      return node_name === $scope.selected_node;
    };

    // sidebar button handler (mobile view)
    $scope.toggleSidebar = function() {
      $("#wrapper").toggleClass("active");
    };

    // bind tooltips
    $("[rel=tooltip]").tooltip({ placement: 'top'});

  });
