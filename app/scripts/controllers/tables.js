'use strict';

angular.module('tables', ['stats', 'sql', 'common', 'tableinfo', 'events'])
  .provider('TabNavigationInfo', function () {
    this.collapsed = [false, true]; // must match $scope.tables of TablesController
    this.$get = function () {
      var collapsed = this.collapsed;
      return {
        'collapsed': collapsed,
        'toggleIndex': function toggleIndex(index) {
          collapsed[index] = !collapsed[index];
        },
        'collapseIndex': function collapseIndex(index) {
          collapsed[index] = true;
        },
        'unCollapseIndex': function collapseIndex(index) {
          collapsed[index] = false;
        }
      };
    };
  })
  .factory('PartitionsTableController', function () {
    return function PartitionsTableController() {
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
  .directive('tables', function () {
    return {
      restrict: 'E',
      replace: true,
      scope: {},
      templateUrl: 'views/tables.html',
      controllerAs: 'TablesController',
      controller: function (ClusterState, $scope, ClusterEventsHandler) {
        $scope.empty = true;
        //initial call
        if (ClusterState.data.tables.length > 0) {
          $scope.empty = false;
        }

        ClusterEventsHandler.register('STATE_REFRESHED', 'TablesController', function () {
          if (ClusterState.data.tables.length > 0) {
            $scope.empty = false;
          }
        });

        $scope.$on('$destroy', function () {
          ClusterEventsHandler.remove('STATE_REFRESHED', 'TablesController');
        });
      }
    };
  })
  .directive('tableDetail', function () {
    return {
      restrict: 'E',
      replace: true,
      scope: {},
      templateUrl: 'views/table-detail.html',
      controllerAs: 'TableDetailController',
      controller: function ($scope, $location, $log, $timeout, $state,
        SQLQuery, queryResultToObjects, roundWithUnitFilter, bytesFilter, TableList,
        TableInfo, TabNavigationInfo, PartitionsTableController, ClusterEventsHandler, ClusterState) {

        $scope.executeQuery = function (query) {
          $location.search({
            'query': query
          });
          $location.path('/console');
        };

        var scopeWatcher = null;
        var activeRequests = {};
        var colorMapLabel = {
          'good': '',
          'warning': 'label-warning',
          'critical': 'label-danger',
          '--': ''
        };
        var colorMapCell = {
          'good': 'cr-cell--success',
          'warning': 'cr-cell--warning',
          'critical': 'cr-cell--danger',
          '--': ''
        };
        var placeholder = {
          'name': '',
          'summary': '',
          'health': '--',
          'health_label_class': '',
          'health_panel_class': '',
          'health_cell_class': '',
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

        var requestId = function () {
          return 'r-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000);
        };

        var cancelRequests = function () {
          for (var k in activeRequests) {
            var request = activeRequests[k];
            request.cancel();
          }
          activeRequests = {};
        };

        var filterByIdent = function (ident) {
          return function (item) {
            return item.partition_ident === ident;
          };
        };

        var isNestedColumn = function (column) {
          var re = /([^\s]+)(\[\'([^\s]+)\'])+/i;
          return column.match(re);
        };

        var render = function (tableSchema, tableName) {
          $scope.ptCtlr = new PartitionsTableController();
          $scope.nothingSelected = false;
          $scope.renderSiderbar = true;
          $scope.isParted = false;

          var constructQuery = function (rows) {
            var query = 'SELECT ';
            var filtered_columns = rows.filter(function (row) {
              return !isNestedColumn(row.column_name);
            }).map(function (row) {
              return '"' + row.column_name + '"';
            });

            query += filtered_columns.join(',');
            query += ' FROM "' + tableSchema + '"."' + tableName + '" LIMIT 100;';
            return query;
          };

          var update = function (success, partitions, cancelled) {
            if (cancelled) {
              return;
            }
            $scope.ptCtlr.data = partitions;
            $scope.isParted = true;
            $scope.renderPartitions = success;
            $scope.renderSchema = true;
          };

          var fetchPartitions = function () {
            if (!tableName || !tableSchema) {
              return;
            }
            // Table Partitions
            var shardStmt = 'SELECT partition_ident, routing_state, state, relocating_node, "primary", SUM(num_docs), AVG(num_docs), COUNT(*), SUM(size) ' +
              'FROM sys.shards ' +
              'WHERE schema_name = ? AND table_name = ? AND partition_ident != \'\' ' +
              'GROUP BY partition_ident, routing_state, state, relocating_node, "primary"';

            var r1 = requestId();
            var q1 = SQLQuery.execute(shardStmt, [tableSchema, tableName], false, false, false, false).success(function (shardQuery) {
              if (typeof activeRequests[r1] == 'undefined') {
                return;
              }
              var tablePartitionStmt = 'SELECT partition_ident, number_of_shards, number_of_replicas, values ' +
                'FROM information_schema.table_partitions ' +
                'WHERE schema_name = ? AND table_name = ? AND closed = false';

              var r2 = requestId();
              var q2 = SQLQuery.execute(tablePartitionStmt, [tableSchema, tableName], false, false, false, false).success(function (tablePartitionQuery) {
                if (typeof activeRequests[r2] == 'undefined') {
                  return;
                }
                var partitions = [];
                var shardResult = queryResultToObjects(shardQuery, ['partition_ident', 'routing_state', 'state', 'relocating_node', 'primary', 'sum_docs', 'avg_docs', 'count', 'size']);
                var partitionResult = queryResultToObjects(tablePartitionQuery, ['partition_ident', 'number_of_shards', 'number_of_replicas', 'values']);

                var idents = shardResult.reduce(function (memo, obj) {
                  var ident = obj.partition_ident;
                  if (memo.indexOf(ident) === -1) {
                    memo.push(ident);
                  }
                  return memo;
                }, []);

                for (var i = 0; i < idents.length; i++) {
                  var ident = idents[i];
                  var shardInfoForPartition = shardResult.filter(filterByIdent(ident));
                  var confInfoForPartition = partitionResult.filter(filterByIdent(ident));
                  if (confInfoForPartition.length === 1) {
                    var info = new TableInfo(shardInfoForPartition,
                      confInfoForPartition[0].number_of_shards);
                    var o = info.asObject();
                    o.partition_values = confInfoForPartition[0].values;
                    o.partition_ident = ident;
                    o.replicas_configured = confInfoForPartition[0].number_of_replicas;
                    o.health_label_class = colorMapLabel[o.health];
                    o.health_cell_class = colorMapCell[o.health];
                    partitions.push(o);
                  }
                }

                update(true, partitions, typeof activeRequests[r2] === 'undefined');
                delete activeRequests[r2];

              }).error(function () {
                update(false, [], typeof activeRequests[r2] === 'undefined');
                delete activeRequests[r2];
              });

              delete activeRequests[r1];
              activeRequests[r2] = q2;

            }).error(function () {
              update(false, [], typeof activeRequests[r1] === 'undefined');
              delete activeRequests[r1];
            });

            activeRequests[r1] = q1;
          };

          if (tableName && tableSchema) {
            // Table Schema
            var tableStmt = 'SELECT column_name, data_type, is_generated, generation_expression ' +
              'FROM information_schema.columns ' +
              'WHERE table_schema = ? AND table_name = ?';
            SQLQuery.execute(tableStmt, [tableSchema, tableName], false, false, false, false)
              .success(function (query) {
                $scope.schemaHeaders = query.cols;
                $scope.schemaRows = queryResultToObjects(query, query.cols);
                $scope.renderSchema = true;
                $scope.query = constructQuery($scope.schemaRows);
              }).error(function () {
                $scope.renderSchema = false;
              });
          }

          function updateTableList() {
            var tables = ClusterState.data.tables;
            if (tables.length > 0) {
              var current = tables.filter(function (item) {
                return item.name === tableName && item.table_schema === tableSchema;
              });
              current = current.length ? current[0] : tables[0];
              $scope.table = current;
              $scope.table_label = current.name;
              if (current.table_schema == 'blob') {
                $scope.table_label = 'BLOB: ' + current.name;
              } else if (current.table_schema != 'doc') {
                $scope.table_label = current.table_schema + '.' + current.name;
              }
              $scope.nothingSelected = current === null;
              $scope.renderSidebar = true;
              if ($scope.table.partitioned) {
                fetchPartitions();
              }

              // redirect to URL of first table in list
              // if URL does not match expected table URL
              var expectedUrl = '/tables/' + current.table_schema + '/' + current.name;
              if ($location.$$url !== expectedUrl) {
                $location.url(expectedUrl);
              }

            } else {
              $scope.table = placeholder;
              $scope.table_label = placeholder.name;
              $scope.nothingSelected = false;
              $scope.renderSidebar = false;
              $scope.renderSchema = false;
              $scope.renderPartitions = false;
            }
            $scope.nr_of_tables = tables.length;
          }

          ClusterEventsHandler.register('STATE_REFRESHED', 'TableDetailController', updateTableList);
          //initial call
          updateTableList();

          $scope.$on('$destroy', function () {
            cancelRequests();
            if (scopeWatcher) {
              scopeWatcher();
              scopeWatcher = null;
            }
            ClusterEventsHandler.remove('STATE_REFRESHED', 'TableDetailController');
          });

          // Initial
          $scope.table = null;
          $scope.renderSidebar = true;
          $scope.renderSchema = false;
          $scope.renderPartitions = false;
          updateTableList();
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

        render($state.params.table_schema, $state.params.table_name);
      }
    };
  })
  .directive('tableList', function () {
    return {
      restrict: 'E',
      replace: true,
      scope: {},
      templateUrl: 'views/tablelist.html',
      controllerAs: 'TableListController',
      controller: function ($scope, $state, TabNavigationInfo, ClusterEventsHandler, ClusterState) {
        var filterBySchemaName = function (name) {
          return function (item) {
            return item.table_schema == name;
          };
        };
        $scope.collapsed = true;

        $scope.table_filter = function (item) {
          if (!$scope.query || (item.fqn.toLowerCase().indexOf($scope.query) != -1)) {
            return true;
          }
          return false;
        };

        $scope.clearFilter = function () {
            $scope.query = '';
        };

        function updateTableList() {
            $scope.tables = [];
            var tables = ClusterState.data.tables;
            var hasTables = tables.length > 0;
            $scope.renderSidebar = hasTables;
            if (hasTables) {
              // use name and schema from first item
              if (!$scope.tableName || !$scope.tableSchema) {
                $scope.tableName = tables[0].name;
                $scope.tableSchema = tables[0].table_schema;
                $state.go('tables.table', {
                  table_schema: $scope.tableSchema,
                  table_name: $scope.tableName
                });
              }

              var idx,
                name;
              var customSchemas = [];
              for (idx in tables) {
                name = tables[idx].table_schema;
                if (name == 'doc' || name == 'blob' || customSchemas.indexOf(name) > -1) {
                  continue;
                }
                customSchemas.push(name);
              }

              $scope.tables.push({
                'display_name': 'Doc',
                'tables': tables.filter(function (item) {
                  return item.table_schema == 'doc';
                }),
                'table_schema': 'doc'
              });
              for (idx in customSchemas) {
                name = customSchemas[idx];
                $scope.tables.push({
                  display_name: name,
                  tables: tables.filter(filterBySchemaName(name)),
                  table_schema: name
                });
              }
              $scope.tables.push({
                display_name: 'Blob',
                tables: tables.filter(function (item) {
                  return item.table_schema == 'blob';
                }),
                table_schema: 'blob'
              });
            }
          }

        ClusterEventsHandler.register('STATE_REFRESHED', 'TableListController', updateTableList);
        //initial call
        updateTableList();

        var render = function (tableSchema, tableName) {
          $scope.tableName = tableName;
          $scope.tableSchema = tableSchema;
          $scope.renderSidebar = true;
          updateTableList();
          $scope.isActive = function (table_schema, table_name) {
            return table_name === $state.params.table_name && table_schema === $state.params.table_schema;
          };

          $scope.startedShardsError = function (table) {
            if (table.partitioned && table.shards_started === 0) {
              return false;
            }
            return table.shards_started < table.shards_configured;
          };

          $scope.toggleElements = function (index) {
            $('#nav-tabs-' + index).collapse('toggle');
            $('#nav-tabs-header-' + index + ' i.fa').toggleClass('fa-caret-down').toggleClass('fa-caret-right');
            TabNavigationInfo.toggleIndex(index);
          };

          $scope.isCollapsed = function (index) {
            return TabNavigationInfo.collapsed[index];
          };
          var table;
          $scope.collapseAll = function () {
            for (table in $scope.tables) {
              $('#nav-tabs-' + table).collapse('toggle');
              $('#nav-tabs-header-' + table + ' i.fa').toggleClass('fa-caret-down').toggleClass('fa-caret-right');
              TabNavigationInfo.collapseIndex(table);
            }
            $scope.collapsed = true;
          };
          $scope.unCollapseAll = function () {
            for (table in $scope.tables) {
              $('#nav-tabs-' + table).collapse('toggle');
              $('#nav-tabs-header-' + table + ' i.fa').toggleClass('fa-caret-down').toggleClass('fa-caret-right');
              TabNavigationInfo.unCollapseIndex(table);
            }
            $scope.collapsed = false;
          };
        };

        $scope.$on('$destroy', function () {
          ClusterEventsHandler.remove('STATE_REFRESHED', 'TableListController');
        });

        render($state.params.table_schema, $state.params.table_name);
      }
    };
  });
