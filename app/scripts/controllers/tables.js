'use strict';

angular.module('tables', ['stats', 'sql', 'common', 'tableinfo'])
  .factory('TableList', function($timeout, TableInfo, SQLQuery, roundWithUnitFilter, bytesFilter, queryResultToObjects){
    var data = {
      'tables': []
    };
    var timeout = null;
    var refreshInterval = 5000;

    var healthPriorityMap = {
      'good': 2,
      'warning': 1,
      'critical': 0,
      '--': 0
    };

    var colorMapLabel = {
      'good': '',
      'warning': 'label-warning',
      'critical': 'label-danger',
      '--': ''
    };

    var colorMapPanel = {
      'good': 'panel-success',
      'warning': 'panel-warning',
      'critical': 'panel-danger',
      '--': 'panel-default'
    };

    var sortByHealth = function sortByHealth(a,b) {
      if (healthPriorityMap[a.health] < healthPriorityMap[b.health]) return -1;
      if (healthPriorityMap[a.health] > healthPriorityMap[b.health]) return 1;
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    };

    var update = function update(success, tables, shards) {
      var _tables = tables || [];
      var _shards = shards || [];

      if (success && _tables.length) {
        for (var i=0; i<_tables.length; i++) {
          var table = _tables[i];
          var shardsForTable = _shards.filter(function(shard, idx) {
            return shard.table_name === table.name;
          });
          var tableInfo = new TableInfo(shardsForTable,
                                        table.shards_configured,
                                        table.partitioned_by);
          var info = tableInfo.asObject();
          $.extend(table, info);
          table.health_label_class = colorMapLabel[table.health];
          table.health_panel_class = colorMapPanel[table.health];
          table.type_display_name = table.schema_name == "doc" ? "Record" : "Blob";

          var summary = roundWithUnitFilter(table.records_total, 1) + ' Records (' + bytesFilter(table.size) + ') / ' +
                table.replicas_configured + ' Replicas / ' + table.shards_configured + ' Shards (' + table.shards_started + ' Started)';

          if (table.records_unavailable) {
            summary = roundWithUnitFilter(table.records_unavailable, 1) + ' Unavailable Records / ' + summary;
          } else if (table.shards_underreplicated) {
            summary = table.shards_underreplicated + ' Underreplicated Shards / ' + summary;
          }
          if (table.records_underreplicated) {
            summary = table.records_underreplicated + ' Underreplicated Records / ' + summary;
          }
          table.summary = summary;
        };

        data.tables = _tables.sort(sortByHealth);
      } else {
        data.tables = [];
      }

      timeout = $timeout(fetch, refreshInterval);
    };

    var fetch = function fetch() {
      $timeout.cancel(timeout);
      console.log('TableInfo.fetch', new Date());
      var stmt = 'select table_name, number_of_shards, number_of_replicas, schema_name, partitioned_by ' +
            'from information_schema.tables ' +
            'where schema_name in (\'doc\', \'blob\')';

      SQLQuery.execute(stmt).success(function(tableQuery){

        var stmt = 'select table_name, schema_name, sum(num_docs), "primary", avg(num_docs), count(*), state, sum(size) ' + // partition_ident
              'from sys.shards ' +
              'group by table_name, schema_name, "primary", state ' +
              'order by table_name, "primary", state';

        SQLQuery.execute(stmt).success(function(shardQuery) {
          var tables = queryResultToObjects(tableQuery, ['name', 'shards_configured', 'replicas_configured', 'schema_name', 'partitioned_by']);
          var shards = queryResultToObjects(shardQuery, ['table_name', 'schema_name', 'sum_docs', 'primary', 'avg_docs', 'count', 'state', 'size']);
          update(true, tables, shards);
        }).error(function(sqlQuery) {
          var tables = queryResultToObjects(tableQuery, ['name', 'shards_configured', 'replicas_configured', 'schema_name', 'partitioned_by']);
          update(true, tables);
        });

      }).error(function(sqlQuery) {
        update(false);
      });

    };

    // initialize
    fetch();

    return {
      'data': data
    };

  })
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
  .controller('TableDetailController', function ($scope, $location, $log, $timeout, $routeParams,
        SQLQuery, queryResultToObjects, roundWithUnitFilter, bytesFilter, TableList, TableInfo, TabNavigationInfo, PartitionsTableController) {
    var _tables = [];
    var tableName = $routeParams.table_name;
    var schemaName = $routeParams.schema_name;
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

    $scope.ptCtlr = new PartitionsTableController();
    $scope.nothingSelected = false;
    $scope.renderSiderbar = true;

    $scope.$watch(function(){ return TableList.data; }, function(data){
      var tables = data.tables;
      if (tables.length > 0) {
        var current = data.tables.filter(function(item, idx){
          return item.name === tableName && item.schema_name === schemaName;
        });
        current = current.length ? current[0] : null;
        $scope.table = current;
        $scope.nothingSelected = current === null;
        $scope.renderSidebar = true;
      } else {
        $scope.table = placeholder;
        $scope.nothingSelected = false;
        $scope.renderSidebar = false;
      }
      fetch();
    }, true);

    var fetch = function fetch(){
      $timeout.cancel(timeout);
      if (!tableName || !schemaName) return;
      // Table Partitions
      var stmt = 'select table_name, partition_ident, sum(num_docs), "primary", avg(num_docs), count(*), state, sum(size) ' +
            'from sys.shards ' +
            'where schema_name = $1 and table_name = $2 and partition_ident != \'\' ' +
            'group by table_name, partition_ident, "primary", state';
      SQLQuery.execute(stmt, [schemaName, tableName]).success(function(query){
        var partitions = queryResultToObjects(query,
                                              ['table_name', 'partition_ident','sum_docs','primary','avg_docs','count','state','size']);

        SQLQuery.execute('select distinct partition_ident ' +
            'from sys.shards ' +
            'where schema_name = $1 and table_name = $2',
            [schemaName, tableName]).success(function(query){
          var res = queryResultToObjects(query, ['partition_ident']);
          var p = [];
          for (var i=0; i<query.rows.length; i++) {
            var ident = res[i].partition_ident;
            var shardInfoForPartition = partitions.filter(function(item, idx){
              return item.partition_ident === ident;
            });
            var info = new TableInfo(shardInfoForPartition, $scope.table.shards_configured);
            var o = info.asObject();
            o.partition_ident = ident;
            o.replicas_configured = $scope.table.replicas_configured;
            p.push(o);
          }
          update(true, p);

        }).error(function(query){
        });

      }).error(function(query){
        console.error(query.error.message);
        update(false, []);
      });

    };

    var update = function update(success, partitions){
      var partitionedBy = $scope.table.partitioned_by;
      console.log(success, partitions, partitionedBy);
      $scope.ptCtlr.data = partitions;
      $scope.renderPartitions = success;
      timeout = $timeout(fetch, refreshInterval);
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

  })
  .controller('TableListController', function ($scope, $routeParams,
        TableList, TabNavigationInfo) {

    var tableName = $routeParams.table_name || '';
    var schemaName = $routeParams.schema_name || '';

    $scope.renderSidebar = true;
    $scope.$watch(function(){ return TableList.data; }, function(data){
      var tables = data.tables;
      var hasTables = tables.length > 0;
      $scope.renderSidebar = hasTables;
      if (hasTables) {
        $scope.tables = [
          {
            "display_name": "Tables",
            "tables": tables.filter(function(item, idx){ return item.schema_name == 'doc'; }),
            "schema_name": "doc"
          },
          {
            "display_name": "Blob Tables",
            "tables": tables.filter(function(item, idx){ return item.schema_name == 'blob'; }),
            "schema_name": "blob"
          }
        ];
      } else {
        $scope.tables = [];
      }
    }, true);

    $scope.isActive = function (schema_name, table_name) {
      return table_name === tableName && schema_name === schemaName;
    };

    // bind tooltips
    $("[rel=tooltip]").tooltip({ placement: 'top'});

    // sidebar button handler (mobile view)
    $scope.toggleSidebar = function() {
      $("#wrapper").toggleClass("active");
    };

    $scope.toggleElements = function(index) {
      $("#nav-tabs-"+index).collapse("toggle");
      $("#nav-tabs-header-"+index+" i.fa").toggleClass("fa-caret-down").toggleClass("fa-caret-right");
      TabNavigationInfo.toggleIndex(index);
    };

    $scope.isCollapsed = function(index) {
      return TabNavigationInfo.collapsed[index];
    };

  });

