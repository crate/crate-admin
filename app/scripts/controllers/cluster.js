'use strict';

angular.module('cluster', ['stats', 'sql', 'common', 'nodeinfo'])
  .directive('cluster', function () {
    return {
      restrict: 'E',
      replace: true,
      scope: {},
      templateUrl: 'views/node.html',
      controllerAs: 'ClusterController',
      controller: function ($scope, $state,
        ClusterState, prepareNodeList, compareByHealth) {

        $scope.nodes = [];
        $scope.selectedNode = null;
        $scope.version = null;
        $scope.nodeId = null || $state.params.node_id;

        var firstRedirect = false;

        function redirectToFirstNode() {
          if (!firstRedirect && $scope.selected && $scope.selected.id) {
            firstRedirect = true;
            $scope.goToPath($scope.selected.id);
          }
        }

        var getUpdatedNodeList = function (nodeId) {
          var cluster = ClusterState.data.cluster;
          $scope.version = ClusterState.data.version;

          $scope.nodes = prepareNodeList(cluster, ClusterState.data.master_node);
          $scope.renderSidebar = cluster.length > 0;
          
          if (!$scope.renderSidebar) {
            $scope.selected = null;
          } else {
            // sort nodes by health and hostname
            $scope.nodes = $scope.nodes.sort(compareByHealth);
            // show sidebar
            var nodeIds = $scope.nodes.map(function (obj) {
              return obj.id;
            });

            if ($scope.nodeId && nodeIds.indexOf(nodeId) >= 0) {

              var selectedNode = $scope.nodes.filter(function (node) {
                return node.id === nodeId;
              });

              $scope.selectedNode = selectedNode.length ? selectedNode[0] : $scope.nodes[0];
            } else {
              $scope.selectedNode = $scope.nodes[0];
              nodeId = $scope.nodes[0].id;
            }
          }
        };

        getUpdatedNodeList($scope.nodeId);

        $scope.$on('clusterState.refreshed', function () {
          getUpdatedNodeList($scope.nodeId);
          redirectToFirstNode();
        });
      }
    };
  })
  .directive('nodeList', function () {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        nodes: '=',
        selected: '='
      },
      templateUrl: 'views/nodelist.html',
      controllerAs: 'NodeListController',
      controller: function ($scope, $state,
        NodeListInfo, compareByHealth, HealthPanelClass) {
        
        $scope.goToPath = function (id) {
          $state.go('nodes.node', {
            node_id: id
          });
        };

        $scope.healthPanelClass = HealthPanelClass;

        $scope.sort = NodeListInfo.sort;
        $scope.sortBy = NodeListInfo.sortBy;
        $scope.sortClass = NodeListInfo.sortClass;


        $scope.isActive = function (node) {
          return node.id === $state.params.node_id;
        };

        $scope.isSameVersion = function (nodeVersion) {
          return $scope.version ? nodeVersion.build_hash === $scope.version.hash : true;
        };

        $scope.$watch('nodes', function () {
          $scope.renderSidebar = $scope.nodes.length > 0;
        });

      }
    };
  })
  .directive('nodeDetail', function () {
    return {
      restrict: 'E',
      replace: true,
      require: '^ClusterController',
      scope: {},
      templateUrl: 'views/node-detail.html',
      controllerAs: 'NodeDetailController',
      controller: function ($scope, $interval, $state, $http, $filter, $location,
        ClusterState, prepareNodeList, compareByHealth) {

        // Needed to format tooltip byte-values in div. graphs
        var byteFormatFunction = $filter('bytes');

        $scope.node = null;
        var options = {
          'chart': {
            'type': 'multiBarHorizontalChart',
            'height': 20,
            'margin': {
              'left': 0,
              'top': 0,
              'bottom': 0,
              'right': 0
            },
            'forceY': [0, 100],
            'showControls': false,
            'showValues': false,
            'duration': 500,
            'showLegend': false,
            'stacked': true,
            'showXaxis': false,
            'showYaxis': false,
            'x': function (d) {
              return d.label;
            },
            'y': function (d) {
              return d.value;
            },
            'xAxis': {
              showMaxMin: false
            },
            'yAxis': {}

          }
        };
        $scope.percent_options = angular.copy(options);
        $scope.percent_options.chart.yAxis = {
          tickFormat: function (d) {
            return String(d) + '%';
          }
        };

        $scope.bytes_options = angular.copy(options);
        $scope.bytes_options.chart.yAxis = {
          tickFormat: function (d) {
            return byteFormatFunction(d, 2);
          }
        };

        var empty = {
          'name': '',
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
          'used': '#5bd5f5',
          'free': '#e2e2e2',
        };

        var version = null;

        var aggregateDataDiskUtilisation = function (node) {
          var fs = {
            total: 0,
            available: 0,
            used: 0,
            available_percent: 0,
            used_percent: 0
          };
          if (node.fs.data) {
            var dataDisks = [];
            for (var k = 0; k < node.fs.data.length; k++) {
              dataDisks.push(node.fs.data[k].dev);
            }
            for (var j = 0; j < node.fs.disks.length; j++) {
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

        var getShardsCountPerState = function (shardInfo, state) {
          return shardInfo.filter(function (shard) {
            return shard.state === state;
          }).reduce(function (acc, table) {
            return acc + table.count;
          }, 0);
        };

        var drawGraph = function (node) {

          $scope.cpuData = [{
            'key': 'System',
            'values': [{
              'label': 'CPU',
              'value': node.cpu.system
          }],
            'color': COLORS.used
        }, {
            'key': 'User',
            'values': [{
              'label': 'CPU',
              'value': node.cpu.user
          }],
            'color': '#5d89fe'
        }, {
            'key': 'Idle',
            'values': [{
              'label': 'CPU',
              'value': Math.max(0, 100 - node.cpu.system - node.cpu.user - node.cpu.stolen)
          }],
            'color': COLORS.free
        }, {
            'key': 'Stolen',
            'values': [{
              'label': 'CPU',
              'value': node.cpu.stolen
          }],
            'color': '#f6bb41'
        }];

          $scope.heapData = [{
            'key': 'Used',
            'values': [{
              'label': 'HEAP',
              'value': node.heap.used
          }],
            'color': COLORS.used
        }, {
            'key': 'Free',
            'values': [{
              'label': 'HEAP',
              'value': node.heap.max - node.heap.used
          }],
            'color': COLORS.free
        }];

          $scope.diskUsageData = [{
            'key': 'Used',
            'values': [{
              'label': 'Disk Usage',
              'value': node.fs.used
          }],
            'color': COLORS.used
        }, {
            'key': 'Free',
            'values': [{
              'label': 'Disk Usage',
              'value': node.fs.available
          }],
            'color': COLORS.free
        }];

          $scope.processCpuData = [{
            'key': 'Used',
            'values': [{
              'label': 'Process CPU',
              'value': Math.min(100.0, node.proc_cpu.percent / node.num_cores)
          }],
            'color': COLORS.used
        }, {
            'key': 'Idle',

            'values': [{
              'label': 'Process CPU',
              'value': Math.max(100.0, node.proc_cpu.percent / node.num_cores)
          }],
            'color': COLORS.free
        }];
        };

        var updateNodeList = function (nodeId) {
          var cluster = angular.copy(ClusterState.data.cluster);
          var shards = angular.copy(ClusterState.data.shards);

          for (var i = 0; i < cluster.length; i++) {
            cluster[i].fs = aggregateDataDiskUtilisation(cluster[i]);
          }
          version = ClusterState.data.version;
          $scope.renderSidebar = $scope.$parent.renderSidebar;

          var nodeList = prepareNodeList(cluster, ClusterState.data.master_node);

          if (!$scope.renderSidebar) {
            // no sidebar
            $scope.node = angular.copy(empty);
          } else {
            // sort nodes by health and hostname
            nodeList = nodeList.sort(compareByHealth);
            // show sidebar
            var nodeIds = nodeList.map(function (obj) {
              return obj.id;
            });
            var currentNode;
            if (nodeId && nodeIds.indexOf(nodeId) >= 0) {
              var selectedNode = nodeList.filter(function (node) {
                return node.id == nodeId;
              });
              currentNode = selectedNode.length ? selectedNode[0] : nodeList[0];
            } else {
              currentNode = nodeList[0];
            }

            $scope.node = currentNode;
            drawGraph($scope.node);

          }
          if ($scope.node && shards && shards.length) {
            var shardInfoPerNode = shards.filter(function (shard) {
              return shard.node_id === $scope.node.id;
            });
            $scope.shardInfo = {
              'started': getShardsCountPerState(shardInfoPerNode, 'STARTED'),
              'initializing': getShardsCountPerState(shardInfoPerNode, 'INITIALIZING'),
              'reallocating': getShardsCountPerState(shardInfoPerNode, 'REALLOCATING'),
              'postrecovery': getShardsCountPerState(shardInfoPerNode, 'POST_RECOVERY')
            };
          }
        };
        var render = function (nodeId) {
          updateNodeList(nodeId);
        };

        $scope.$on('clusterState.refreshed', function () {
          updateNodeList($state.params.node_id);
        });

        $scope.toolTipUsedPercentFunction = function () {
          return function (key, x, y) {
            return '<p>' + key + '<br /><b>' + y + '%</b></p>';
          };
        };

        $scope.toolTipUsedBytesFunction = function () {
          return function (key, x, y) {
            return '<p>' + key + '<br /><b>' + y + '</b></p>';
          };
        };

        $scope.yAxisByteFormatFunction = function () {
          return function (d) {
            return byteFormatFunction(d, 2);
          };
        };

        // bind tooltips
        $('[rel=tooltip]').tooltip({
          placement: 'top'
        });

        // sidebar button handler (mobile view)
        $scope.toggleSidebar = function () {
          $('#page-viewport').toggleClass('show-sidebar');
          $('.menu-toggle i.fa').toggleClass('fa-angle-double-right').toggleClass('fa-angle-double-left');
        };

        $scope.isSameVersion = function (nodeVersion) {
          return version ? nodeVersion.build_hash === version.hash : true;
        };

        render($state.params.node_id);
      }
    };
  });
