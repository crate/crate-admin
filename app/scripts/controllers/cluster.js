'use strict';

angular.module('cluster', ['stats', 'sql', 'common'])
  .controller('ClusterController', function ($scope, $interval, $routeParams, $http, $filter, ClusterState) {

    var intervalId;
    var refreshInterval = 5000;

    $scope.percentageLimitYellow = 90;
    $scope.percentageLimitRed = 98;

    var colorMapPanel = {
      "good": 'panel-success',
      "warning": 'panel-warning',
      "critical": 'panel-danger',
      '--': 'panel-default'
    };
    var colorMapLabel = {
      "good": '',
      "warning": 'label-warning',
      "critical": 'label-danger',
      '--': ''
    };
    var healthPriorityMap = {
      "good": 2, "warning": 1, "critical": 0, "--": 0
    };

    var Health = function Health(node) {
      this.getStatus = function getStatus(val){
        if (val > $scope.percentageLimitRed) {
            return 'critical';
        } else if (val > $scope.percentageLimitYellow) {
            return 'warning';
        }
        return 'good';
      }
      this.value = Math.max(node.fs.used_percent, node.mem.used_percent);
      this.status = this.getStatus(this.value);
    };

    var selected_node = $routeParams.node_name || '';

    var empty_node = {
      'name': 'Cluster (0 Nodes)',
      'id': '',
      'summary': [],
      'health': '--',
      'health_label_class': '',
      'health_panel_class': '',
      'hostname': '',
      'address': '',
      'heap': {
        'total': 0,
        'used': 0,
        'used_percent': 0
      },
      'fs': {
        'free': 0,
        'used': 0,
        'free_percent': 0,
        'used_percent': 0
      }
    };

    var compareListByHealth = function compareListByHealth(a,b) {
      if (healthPriorityMap[a.health.status] < healthPriorityMap[b.health.status]) return -1;
      if (healthPriorityMap[a.health.status] > healthPriorityMap[b.health.status]) return 1;
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    };

    var loadNodesStats = function loadNodesStats() {
      var cluster = ClusterState.data.cluster;
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
    };

    var prepareNodeList = function prepareNodeList(cluster) {
      var nodeList = [];
      for (var i=0; i<cluster.length; i++) {
        var node = angular.copy(cluster[i]);
        node.address = "http://" + (node.hostname || "localhost") + ":" + node.port.http;
        node.health = new Health(node);
        node.health_label_class = colorMapLabel[node.health.status];
        node.health_panel_class = colorMapLabel[node.health.status];
        node.mem.total = node.mem.used + node.mem.free;
        nodeList.push(node);
      }
      return nodeList;
    };

    loadNodesStats();
    intervalId = $interval(loadNodesStats, refreshInterval);

    $scope.$on("$destroy", function(){
      $interval.cancel(intervalId);
    });

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