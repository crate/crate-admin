'use strict';

angular.module('tables', ['stats', 'sql', 'common', 'tableinfo'])
  .provider('TabNavigationInfo', function(){
    this.collapsed = [false, true]; // must match $scope.tables of TablesController
    this.$get = function() {
      var collapsed = this.collapsed;
      return {
        'collapsed': collapsed,
        'toggleIndex': function toggleIndex(index){
          collapsed[index] = !collapsed[index];
        }
      };
    };
  })
  .factory('PartitionsTableController', function () {
    return function PartitionsTableController(){
      this.headers = [
        ['health', 'Health'],
        ['partition_ident', 'Ident'],
        ['replicas_configured', 'Config. Replicas'],
        ['shards_configured', 'Config. Shards'],
        ['shards_started', 'Started Shards'],
        ['shards_missing', 'Missing Shards'],
        ['shards_underreplicated', 'Underr. Shards'],
        ['records_total', 'Total Records'],
        ['records_unavailable', 'Unavail. Records'],
        ['records_underreplicated', 'Underr. Records'],
        ['size', 'Size']
      ];
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
      this.selected = function selected(col){
        if (col === this.sort.col) {
          return this.sort.desc ? 'fa fa-chevron-down' : 'fa fa-chevron-up';
        }
        return '';
      };
    };
  })
  .controller('TableDetailController', function ($scope, $location, $log, $timeout, $route,
        SQLQuery, queryResultToObjects, roundWithUnitFilter, bytesFilter, TableList, TableInfo, TabNavigationInfo, PartitionsTableController) {

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
      'shards_active': 0,
      'shards_missing': 0,
      'shards_underreplicated': 0,
      'replicas_configured': '0',
      'size': 0
    };

    // http://stackoverflow.com/a/14329570/1143231
    // http://stackoverflow.com/a/12429133/1143231
    var lastRoute = $route.current;
    $scope.$on('$locationChangeSuccess', function(event) {
      cancelRequests();
      if ($route.current.$$route.controller === 'TableDetailController') {
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
      $("#wrapper").toggleClass("active");
    };

    var cancelRequests = function cancelRequests() {
      $timeout.cancel(timeout);
      for (var k in activeRequests) {
        var request = activeRequests[k];
        request.cancel();
      }
      activeRequests = {};
    };

    var render = function render(schemaName, tableName){

      $scope.ptCtlr = new PartitionsTableController();
      $scope.nothingSelected = false;
      $scope.renderSiderbar = true;

      $scope.$watch(function(){ return TableList.data; }, function(data){
        var tables = data.tables;
        if (tables.length > 0) {
          var current = tables.filter(function(item, idx){
            return item.name === tableName && item.schema_name === schemaName;
          });
          current = current.length ? current[0] : tables[0];
          $scope.table = current;
          $scope.nothingSelected = current === null;
          $scope.renderSidebar = true;
          if ($scope.table.partitioned) {
            fetchPartitions();
          }
        } else {
          $scope.table = placeholder;
          $scope.nothingSelected = false;
          $scope.renderSidebar = false;
          $scope.renderSchema = false;
          $scope.renderPartitions = false;
        }
      }, true);

      var fetchPartitions = function fetchPartitions(){
        $timeout.cancel(timeout);
        if (!tableName || !schemaName) return;
        var requestId = 'r' + new Date().getTime();
        // Table Partitions
        var stmt = 'select partition_ident, sum(num_docs), "primary", avg(num_docs), count(*), state, sum(size) ' +
              'from sys.shards ' +
              'where schema_name = $1 and table_name = $2 and partition_ident != \'\' ' +
              'group by partition_ident, "primary", state';
        var q = SQLQuery.execute(stmt, [schemaName, tableName]).success(function(query){
          if (typeof activeRequests[requestId] == 'undefined') return;
          var result = queryResultToObjects(query,
                                            ['partition_ident','sum_docs','primary','avg_docs','count','state','size']);
          var idents = result.reduce(function(memo, obj, idx){
            var ident = obj.partition_ident;
            if (memo.indexOf(ident) === -1) memo.push(ident);
            return memo;
          }, []);

          var partitions = [];
          for (var i=0; i<idents.length; i++) {
            var ident = idents[i];
            var shardInfoForPartition = result.filter(function(item, idx){
              return item.partition_ident === ident;
            });
            var info = new TableInfo(shardInfoForPartition, $scope.table.shards_configured);
            var o = info.asObject();
            o.partition_ident = ident;
            o.replicas_configured = $scope.table.replicas_configured;
            o.health_label_class = colorMapLabel[o.health];
            partitions.push(o);
          }

          delete activeRequests[requestId];
          update(true, partitions);
        }).error(function(query){
          delete activeRequests[requestId];
          update(false, []);
        });
        activeRequests[requestId] = q;
      };

      var update = function update(success, partitions){
        $scope.ptCtlr.data = partitions;
        $scope.renderPartitions = success;
        $scope.renderSchema = success;
        timeout = $timeout(fetchPartitions, refreshInterval);
      };

      if (tableName && schemaName) {
        // Table Schema
        var tableStmt = "select column_name, data_type from information_schema.columns " +
              "where schema_name = $1 and table_name = $2";
        SQLQuery.execute(tableStmt, [schemaName, tableName]).success(function(query){
          $scope.schemaHeaders = query.cols;
          $scope.schemaRows = query.rows;
          $scope.renderSchema = true;
        }).error(function(query){
          $scope.renderSchema = false;
        });
      }

      $scope.$on('$destroy', function(){
        $timeout.cancel(timeout);
      });

      // Initial
      $scope.table = null;
      $scope.renderSidebar = true;
      $scope.renderSchema = false;
      $scope.renderPartitions = false;

    };

    render($route.current.params.schema_name,
           $route.current.params.table_name);

  })
  .controller('TableListController', function ($scope, $route,
        TableList, TabNavigationInfo) {

    // http://stackoverflow.com/a/14329570/1143231
    // http://stackoverflow.com/a/12429133/1143231
    $scope.$on('$locationChangeSuccess', function(event) {
      if ($route.current.$$route.controller === 'TableDetailController') {
        var params = $route.current.params;
        render(params.schema_name, params.table_name);
      }
    });

    var render = function render(schemaName, tableName){

      $scope.renderSidebar = true;
      $scope.$watch(function(){ return TableList.data; }, function(data){
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
            if (name == 'doc' || name == 'blob') {
              continue;
            }
            customSchemas.push(name);
          }

          // group tables
          $scope.tables = [
            {
              "display_name": "Doc Tables",
              "tables": tables.filter(function(item, idx){ return item.schema_name == 'doc'; }),
              "schema_name": "doc"
            }
          ];
          for (var idx in customSchemas) {
            var name = customSchemas[idx];
            $scope.tables.push(
               {
                "display_name": name + " Tables",
                "tables": tables.filter(function(item, idx){ return item.schema_name == name; }),
                "schema_name": name
              }
            );
          }
          $scope.tables.push(
             {
              "display_name": "Blob Tables",
              "tables": tables.filter(function(item, idx){ return item.schema_name == 'blob'; }),
              "schema_name": "blob"
            }
          );
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

