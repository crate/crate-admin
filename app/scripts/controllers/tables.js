'use strict';

angular.module('tables', ['stats', 'sql', 'common', 'tableinfo'])
  .provider('TabNavigationInfo', function(){
    this.collapsed = [false, true]; // must match $scope.tables of TablesController
    this.$get = function() {
      var collapsed = this.collapsed;
      return {
        'collapsed': collapsed,
        'toggleIndex': function toggleIndex(index) {
          collapsed[index] = !collapsed[index];
        }
      };
    };
  })
  .factory('PartitionsTableController', function () {
    return function PartitionsTableController(){
      this.data = [];
      this.sort = {
        col: 'partition_ident',
        desc: false
      };
      this.setPartitions = function setPartitions(partitions) {
        this.data = partitions;
      };
      this.sortByColumn = function sortByColumn(col) {
        if (this.sort.col === col) {
          this.sort.desc = !this.sort.desc;
        } else {
          this.sort.col = col;
          this.sort.desc = false;
        }
      };
      this.selected = function selected(col) {
        if (col === this.sort.col) {
          return this.sort.desc ? 'fa fa-chevron-down' : 'fa fa-chevron-up';
        }
        return '';
      };
    };
  })
  .controller('TableDetailController', function ($scope, $location, $log, $timeout, $route,
        SQLQuery, queryResultToObjects, roundWithUnitFilter, bytesFilter, TableList, TableInfo, TabNavigationInfo, PartitionsTableController) {

    var scopeWatcher = null;
    var activeRequests = {};
    var _tables = [];
    var refreshInterval = 5000;
    var timeout = null;
    var colorMapPanel = {
      'good': 'panel-success',
      'warning': 'panel-warning',
      'critical': 'panel-danger',
      '--': 'panel-default'
    };
    var colorMapLabel = {
      'good': '',
      'warning': 'label-warning',
      'critical': 'label-danger',
      '--': ''
    };
    var placeholder = {
      'name': 'Tables (0 found)',
      'summary': '',
      'health': '--',
      'health_label_class': '',
      'health_panel_class': '',
      'records_total': 0,
      'records_replicated': 0,
      'records_underreplicated': 0,
      'records_unavailable': 0,
      'shards_configured': 0,
      'shards_started': 0,
      'shards_missing': 0,
      'shards_underreplicated': 0,
      'replicas_configured': '0',
      'size': 0,
      'recovery_percent': 0
    };

    // http://stackoverflow.com/a/14329570/1143231
    // http://stackoverflow.com/a/12429133/1143231
    var lastRoute = $route.current;
    $scope.$on('$locationChangeSuccess', function(event) {
      if ($route.current.$$route.controller === 'TableDetailController') {
        if (scopeWatcher) {
          scopeWatcher();
          scopeWatcher = null;
        }
        cancelRequests();
        var params = $route.current.params;
        render(params.schema_name, params.table_name);
        $route.current = lastRoute;
        // apply new params to old route
        $route.current.params = params;
      }
    });

    // bind tooltips
    $("[rel=tooltip]").tooltip({ placement: 'top'});

    // sidebar button handler (mobile view)
    $scope.toggleSidebar = function() {
      $("#page-viewport").toggleClass("show-sidebar");
      $(".menu-toggle i.fa").toggleClass("fa-angle-double-right").toggleClass("fa-angle-double-left");
    };

    var requestId = function requestId() {
      return 'r-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000);
    };

    var cancelRequests = function cancelRequests() {
      for (var k in activeRequests) {
        var request = activeRequests[k];
        request.cancel();
      }
      activeRequests = {};
    };

    var render = function render(schemaName, tableName) {
      $scope.ptCtlr = new PartitionsTableController();
      $scope.nothingSelected = false;
      $scope.renderSiderbar = true;
      $scope.isParted = false;

      scopeWatcher = $scope.$watch(function(){ return TableList.data; }, function(data) {
        var tables = data.tables;
        if (tables.length > 0) {
          var current = tables.filter(function(item, idx){
            return item.name === tableName && item.schema_name === schemaName;
          });
          current = current.length ? current[0] : tables[0];
          $scope.table = current;
          $scope.table_label = current.name;
          if (current.schema_name == "blob") {
            $scope.table_label = "BLOB: " + current.name;
          } else if (current.schema_name != "doc") {
            $scope.table_label = current.schema_name + "." + current.name;
          }
          $scope.nothingSelected = current === null;
          $scope.renderSidebar = true;
          if ($scope.table.partitioned) {
            fetchPartitions();
          }
        } else {
          $scope.table = placeholder;
          $scope.table_label = placeholder.name;
          $scope.nothingSelected = false;
          $scope.renderSidebar = false;
          $scope.renderSchema = false;
          $scope.renderPartitions = false;
        }
      }, true);

      var fetchPartitions = function fetchPartitions() {
        if (!tableName || !schemaName) return;
        // Table Partitions
        var shardStmt = 'SELECT partition_ident, routing_state, state, relocating_node, "primary", SUM(num_docs), AVG(num_docs), COUNT(*), SUM(size) ' +
          'FROM sys.shards ' +
          'WHERE schema_name = ? AND table_name = ? AND partition_ident != \'\' ' +
          'GROUP BY partition_ident, routing_state, state, relocating_node, "primary"';

        var r1 = requestId();
        var q1 = SQLQuery.execute(shardStmt, [schemaName, tableName]).success(function(shardQuery) {
          if (typeof activeRequests[r1] == 'undefined') return;
          var tablePartitionStmt = 'select partition_ident, number_of_shards, number_of_replicas, values ' +
            'from information_schema.table_partitions ' +
            'where schema_name = ? and table_name = ?';

          var r2 = requestId();
          var q2 = SQLQuery.execute(tablePartitionStmt, [schemaName, tableName]).success(function(tablePartitionQuery) {
            if (typeof activeRequests[r2] == 'undefined') return;
            var partitions = [];
            var shardResult = queryResultToObjects(shardQuery,
              ['partition_ident', 'routing_state', 'state', 'relocating_node', 'primary', 'sum_docs', 'avg_docs', 'count', 'size']);
            var partitionResult = queryResultToObjects(tablePartitionQuery,
              ['partition_ident', 'number_of_shards', 'number_of_replicas', 'values']);

            var idents = shardResult.reduce(function(memo, obj, idx) {
              var ident = obj.partition_ident;
              if (memo.indexOf(ident) === -1) memo.push(ident);
              return memo;
            }, []);

            for (var i=0; i<idents.length; i++) {
              var ident = idents[i];
              var shardInfoForPartition = shardResult.filter(function(item, idx) {
                return item.partition_ident === ident;
              });
              var confInfoForPartition = partitionResult.filter(function(item, idx) {
                return item.partition_ident === ident;
              });
              if (confInfoForPartition.length === 1) {
                var info = new TableInfo(shardInfoForPartition,
                                         confInfoForPartition[0].number_of_shards);
                var o = info.asObject();
                o.partition_values = confInfoForPartition[0].values;
                o.partition_ident = ident;
                o.replicas_configured = confInfoForPartition[0].number_of_replicas;
                o.health_label_class = colorMapLabel[o.health];
                partitions.push(o);
              }
            }

            update(true, partitions, typeof activeRequests[r2] === 'undefined');
            delete activeRequests[r2];

          }).error(function(query) {
            update(false, [], typeof activeRequests[r2] === 'undefined');
            delete activeRequests[r2];
          });

          delete activeRequests[r1];
          activeRequests[r2] = q2;

        }).error(function(query) {
          update(false, [], typeof activeRequests[r1] === 'undefined');
          delete activeRequests[r1];
        });

        activeRequests[r1] = q1;
      };

      var update = function update(success, partitions, cancelled) {
        if (cancelled) { return; }
        $scope.ptCtlr.data = partitions;
        $scope.isParted = true;
        $scope.renderPartitions = success;
        $scope.renderSchema = true;
      };

      if (tableName && schemaName) {
        // Table Schema
        var tableStmt = "select column_name, data_type from information_schema.columns " +
              "where schema_name = ? and table_name = ?";
        SQLQuery.execute(tableStmt, [schemaName, tableName]).success(function(query) {
          $scope.schemaHeaders = query.cols;
          $scope.schemaRows = query.rows;
          $scope.renderSchema = true;
        }).error(function(query){
          $scope.renderSchema = false;
        });
      }

      $scope.$on('$destroy', function() {
        cancelRequests();
        if (scopeWatcher) {
          scopeWatcher();
          scopeWatcher = null;
        }
      });

      // Initial
      $scope.table = null;
      $scope.renderSidebar = true;
      $scope.renderSchema = false;
      $scope.renderPartitions = false;

    };

    render($route.current.params.schema_name, $route.current.params.table_name);

  })
  .controller('TableListController', function ($scope, $route, TableList, TabNavigationInfo) {

    // http://stackoverflow.com/a/14329570/1143231
    // http://stackoverflow.com/a/12429133/1143231
    $scope.$on('$locationChangeSuccess', function(event) {
      if ($route.current.$$route.controller === 'TableDetailController') {
        var params = $route.current.params;
        render(params.schema_name, params.table_name);
      }
    });

    var render = function render(schemaName, tableName) {
      $scope.renderSidebar = true;
      $scope.$watch(function(){ return TableList.data; }, function(data) {
        var tables = data.tables;
        var hasTables = tables.length > 0;
        $scope.renderSidebar = hasTables;
        if (hasTables) {
          // use name and schema from first item
          if (!tableName || !schemaName) {
            tableName = tables[0].name;
            schemaName = tables[0].schema_name;
          }

          var customSchemas = [];
          for (var idx in tables) {
            var name = tables[idx].schema_name;
            if (name == 'doc' || name == 'blob' || customSchemas.indexOf(name) > -1) {
              continue;
            }
            customSchemas.push(name);
          }

          $scope.tables = [];
          $scope.tables.push({
            "display_name": "Doc",
            "tables": tables.filter(function(item, idx){
              return item.schema_name == 'doc';
            }),
            "schema_name": "doc"
          });
          for (var idx in customSchemas) {
            var name = customSchemas[idx];
            $scope.tables.push({
              "display_name": name,
              "tables": tables.filter(function(item, idx){
                return item.schema_name == name;
              }),
              "schema_name": name
            });
          }
          $scope.tables.push({
            "display_name": "Blob",
            "tables": tables.filter(function(item, idx){
              return item.schema_name == 'blob';
            }),
            "schema_name": "blob"
          });
        } else {
          $scope.tables = [];
        }
      }, true);

      $scope.isActive = function (schema_name, table_name) {
        return table_name === tableName && schema_name === schemaName;
      };

      $scope.startedShardsError = function(table) {
        if (table.partitioned && table.shards_started === 0) return false;
        return (table.shards_started < table.shards_configured);
      };

      $scope.toggleElements = function(index) {
        $("#nav-tabs-"+index).collapse("toggle");
        $("#nav-tabs-header-"+index+" i.fa").toggleClass("fa-caret-down").toggleClass("fa-caret-right");
        TabNavigationInfo.toggleIndex(index);
      };

      $scope.isCollapsed = function(index) {
        return TabNavigationInfo.collapsed[index];
      };
    };

    render($route.current.params.schema_name, $route.current.params.table_name);
  });
