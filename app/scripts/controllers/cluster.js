'use strict';

angular.module('cluster', ['stats', 'sql', 'common', 'nodeinfo'])
  .controller('NodeListController', function($scope, $route,
        ClusterState, prepareNodeList, NodeHealth, NodeListInfo, compareByHealth){

    $scope.nodes = [];
    $scope.selected = null;
    $scope.percentageLimitYellow = NodeHealth.THRESHOLD_WARNING;
    $scope.percentageLimitRed = NodeHealth.THRESHOLD_CRITICAL;

    var version = null;

    // http://stackoverflow.com/a/14329570/1143231
    // http://stackoverflow.com/a/12429133/1143231
    $scope.$on('$locationChangeSuccess', function(event) {
      if ($route.current.$$route.controller === 'NodeDetailController') {
        render($route.current.params.node_name);
      }
    });

    var render = function render(nodeName) {

      $scope.$watch(function() { return ClusterState.data; }, function (data) {
        var cluster = data.cluster;
        version = data.version;
        var showSidebar = cluster.length > 0;
        $scope.renderSidebar = showSidebar;
        var nodeList = prepareNodeList(cluster);

        if (!showSidebar) {
          $scope.selected = null;
        } else {
          // sort nodes by health and hostname
          nodeList = nodeList.sort(compareByHealth);
          // show sidebar
          var nodeNames = nodeList.map(function(obj){
            return obj.name;
          });
          if (nodeName && nodeNames.indexOf(nodeName)>=0) {
            var selectedNode = nodeList.filter(function(node, idx) {
              return node.name === nodeName;
            });
            $scope.selected = selectedNode.length ? selectedNode[0] : nodeList[0];
          } else {
            $scope.selected = nodeList[0];
            nodeName = nodeList[0].name;
          }
        }
        $scope.nodes = nodeList;
      }, true);

      $scope.sort = NodeListInfo.sort;
      $scope.sortBy = NodeListInfo.sortBy;
      $scope.sortClass = NodeListInfo.sortClass;

      $scope.isActive = function (node) {
        return node.name === nodeName;
      };

      $scope.isSameVersion = function(nodeVersion){
        return version ? nodeVersion.build_hash === version.hash : true;
      };

    };

    render($route.current.params.node_name);

  })
  .controller('NodeDetailController', function ($scope, $interval, $route, $http, $filter,
        ClusterState, prepareNodeList, NodeHealth, compareByHealth) {
    $scope.node = null;
    $scope.percentageLimitYellow = NodeHealth.THRESHOLD_WARNING;
    $scope.percentageLimitRed = NodeHealth.THRESHOLD_CRITICAL;

    var empty = {
      'name': 'Cluster is not reachable',
      'id': '',
      'summary': [],
      'health': '--',
      'health_label_class': '',
      'health_panel_class': '',
      'hostname': '--',
      'address': '',
      'version': {
        'number': '--',
        'build_hash': '',
        'build_snapshot': false
      },
      'heap': {
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
    var version = null;

    // http://stackoverflow.com/a/14329570/1143231
    // http://stackoverflow.com/a/12429133/1143231
    var lastRoute = $route.current;
    $scope.$on('$locationChangeSuccess', function(event) {
      if ($route.current.$$route.controller === 'NodeDetailController') {
        var params = $route.current.params;
        render(params.node_name);
        $route.current = lastRoute;
        // apply new params to old route
        $route.current.params = params;
      }
    });

    var render = function render(nodeName){

      $scope.$watch(function() { return ClusterState.data; }, function (data) {
        var cluster = data.cluster;
        version = data.version;
        var showSidebar = cluster.length > 0;

        $scope.renderSidebar = showSidebar;

        var nodeList = prepareNodeList(cluster);

        if (!showSidebar) {
          // no sidebar
          $scope.node = angular.copy(empty);
        } else {
          // sort nodes by health and hostname
          nodeList = nodeList.sort(compareByHealth);
          // show sidebar
          var nodeNames = nodeList.map(function(obj){
            return obj.name;
          });
          if (nodeName && nodeNames.indexOf(nodeName)>=0) {
            var selectedNode = nodeList.filter(function(node, idx) {
              return node.name == nodeName;
            });
            $scope.node = selectedNode.length ? selectedNode[0] : nodeList[0];
          } else {
            $scope.node = nodeList[0];
          }
        }
      }, true);

      // sidebar button handler (mobile view)
      $scope.toggleSidebar = function() {
        $("#wrapper").toggleClass("active");
      };

      $scope.isSameVersion = function(nodeVersion){
        return version ? nodeVersion.build_hash === version.hash : true;
      };

      // bind tooltips
      $("[rel=tooltip]").tooltip({ placement: 'top'});

    };

    render($route.current.params.node_name);

  });
