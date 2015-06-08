'use strict';

angular.module('cluster', ['stats', 'sql', 'common', 'nodeinfo'])
  .controller('NodeListController', function($scope, $route,
        ClusterState, prepareNodeList, NodeHealth, NodeListInfo, compareByHealth){

    $scope.nodes = [];
    $scope.selected = null;
    $scope.percentageLimitYellow = NodeHealth.THRESHOLD_WARNING;
    $scope.percentageLimitRed = NodeHealth.THRESHOLD_CRITICAL;

    var currentWatcher = null;
    var version = null;
    var nodeName = null;

    // http://stackoverflow.com/a/14329570/1143231
    // http://stackoverflow.com/a/12429133/1143231
    $scope.$on('$locationChangeSuccess', function(event) {
      if ($route.current.$$route.controller === 'NodeDetailController') {
        render($route.current.params.node_name);
      }
    });

    var render = function render(_nodeName) {
      nodeName = _nodeName;
      if (currentWatcher) {
        // de-register
        currentWatcher();
      }
      currentWatcher = $scope.$watch(function() { return ClusterState.data; }, function (data) {
        var cluster = angular.copy(data.cluster);
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
    };
    

    $scope.sort = NodeListInfo.sort;
    $scope.sortBy = NodeListInfo.sortBy;
    $scope.sortClass = NodeListInfo.sortClass;

    $scope.isActive = function(node) {
      return node.name === nodeName;
    };

    $scope.isSameVersion = function(nodeVersion){
      return version ? nodeVersion.build_hash === version.hash : true;
    };

    render($route.current.params.node_name);

  })
  .controller('NodeDetailController', function ($scope, $interval, $route, $http, $filter,
        ClusterState, prepareNodeList, NodeHealth, compareByHealth) {

    // Needed to format tooltip byte-values in div. graphs
    var byteFormatFunction = $filter('bytes');

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
        'available': 0,
        'used': 0,
        'available_percent': 0,
        'used_percent': 0
      },
      'shardInfo': {
        'started': -1,
        'initializing': -1,
        'reallocating': -1,
        'postrecovery': -1
      }
    };
    var COLORS = {
      'used': '#55d4f5',
      'free': '#eeeeee',
    };
   
    var version = null;
    var currentWatcher = null;

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

    var aggregateDataDiskUtilisation = function aggregateDataDiskUtilisation(node) {
      var fs = {
        total: 0,
        available: 0,
        used: 0,
        available_percent: 0,
        used_percent: 0
      };
      if (node.fs.data) {
        var dataDisks = [];
        for (var k=0; k<node.fs.data.length; k++) {
          dataDisks.push(node.fs.data[k].dev);
        }
        for (var j=0; j<node.fs.disks.length; j++) {
          var disk = node.fs.disks[j];
          var isDataDisk = dataDisks.indexOf(disk.dev) > -1;
          if (isDataDisk) {
            fs.total += disk.size;
            fs.available += disk.available;
            fs.used += disk.used;
          }
        }
        fs.available_percent = 100.0 * fs.available / fs.total;
        fs.used_percent = 100.0 * fs.used / fs.total;
      }
      return fs;
    };

    var getShardsCountPerState = function(shardInfo, state) {
      return shardInfo.filter(function (shard) {
        return shard.state === state;
      }).reduce(function(acc, table) {
        return acc + table.count;
      }, 0);
    };

    var render = function render(nodeName){
      if (currentWatcher) {
        // de-register
        currentWatcher();
      }
      currentWatcher = $scope.$watch(function() { return ClusterState.data; }, function (data) {
        var cluster = angular.copy(data.cluster);
        var shards = angular.copy(data.shards);

        for (var i=0; i<cluster.length; i++) {
          cluster[i].fs = aggregateDataDiskUtilisation(cluster[i]);
        }
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
          drawGraph($scope.node);
        }
        if (shards && shards.length) {
          var shardInfoPerNode = shards.filter(function (shard) {
            return shard.node_id === $scope.node.id;
          });
          $scope.shardInfo = {
            'started': getShardsCountPerState(shardInfoPerNode, "STARTED"),
            'initializing': getShardsCountPerState(shardInfoPerNode, "INITIALIZING"),
            'reallocating': getShardsCountPerState(shardInfoPerNode, "REALLOCATING"),
            'postrecovery': getShardsCountPerState(shardInfoPerNode, "POST_RECOVERY")
          };
        }
      }, true);
    };

    $scope.toolTipUsedPercentFunction = function(){
      return function(key, x, y, e, graph) {
        return '<p><b>'+y+'%</b></p>';
      }
    }

    $scope.toolTipUsedBytesFunction = function(){
      return function(key, x, y, e, graph) {
        return '<p><b>'+y+'</b></p>';
      }
    }

    $scope.yAxisByteFormatFunction = function(){
      return function(d) {
        return byteFormatFunction(d, 2);
      }
    }

    var drawGraph = function drawGraph(node) {

      $scope.cpuData = [
        {
          "key": "System",
          "values": [["CPU", node.cpu.system]],
          "color": COLORS.used
        },
        {
          "key": "User",
          "values": [["CPU", node.cpu.user]],
          "color": "#5987ff"
        },
        {
          "key": "Idle",
          "values": [["CPU", Math.max(0, 100-node.cpu.system-node.cpu.user-node.cpu.stolen)]],
          "color": COLORS.free
        },
        {
          "key": "Stolen",
          "values": [["CPU", node.cpu.stolen]],
          "color": "#ff814d"
        }];

      $scope.crateProcessData = [
        {
          "key": "Used",
          "values": [["Crate Process CPU", Math.min(100, node.proc_cpu.percent)]],
          "color": COLORS.used
        }, 
        {
          "key": "Free",
          "values": [["Crate Process CPU", Math.max(0, 100.0-node.proc_cpu.percent)]],
          "color": COLORS.free
        }
      ];

      $scope.heapData = [
        {
          "key": "Used",
          "values": [["HEAP", node.heap.used]],
          "color": COLORS.used
        }, 
        {
          "key": "Free",
          "values": [["HEAP", node.heap.max - node.heap.used]],
          "color": COLORS.free
        }
      ];

      $scope.diskUsageData = [
        {
          "key": "Used",
          "values": [["Disk Usage", node.fs.used]],
          "color": COLORS.used
        },
        {
          "key": "Free",
          "values": [["Disk Usage", node.fs.available]],
          "color": COLORS.free
        }
      ];
    }

    // bind tooltips
    $("[rel=tooltip]").tooltip({ placement: 'top'});

    // sidebar button handler (mobile view)
    $scope.toggleSidebar = function() {
      $("#wrapper").toggleClass("active");
    };

    $scope.isSameVersion = function(nodeVersion){
      return version ? nodeVersion.build_hash === version.hash : true;
    };

    render($route.current.params.node_name);

  });
