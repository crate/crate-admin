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
        ['values', 'Values'],
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
        SQLQuery, queryResultToObjects, roundWithUnitFilter, bytesFilter, TableInfo, TabNavigationInfo, PartitionsTableController) {

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

    var fetch = function fetch(){
      $timeout.cancel(timeout);
      // Table Info
      var stmt1 = 'select table_name, number_of_shards, number_of_replicas, schema_name, partitioned_by ' +
            'from information_schema.tables ' +
            'where schema_name=$1 and table_name=$2';

      SQLQuery.execute(stmt1, [schemaName, tableName]).success(function(query){
        var res = queryResultToObjects(query,
                                       ['name','num_shards','num_replicas','schema_name','partitioned_by']);
        var table = res.length > 0 ? res[0] : null;
        update(true, table);
      }).error(function(query){
        console.error(query);
        update(false);
      });

      // Table Partitions
      var stmt2 = 'select partition_ident, sum(num_docs), "primary", avg(num_docs), count(*), state, sum(size) ' +
            'from sys.shards ' +
            'where schema_name=$1 and table_name=$2 and partition_ident is not null ' +
            'group by partition_ident, "primary", state';
      SQLQuery.execute(stmt2, [schemaName, tableName]).success(function(query){
        var res = queryResultToObjects(query,
                                       ['partition_ident','sum_docs','primary','avg_docs','count','state','size']);
        console.log(res);
        $scope.ptCtlr.data = res;
        $scope.renderPartitions = true;
      }).error(function(query){
        $scope.renderPartitions = false;
        console.error(query.error.message);
      });

    };

    var update = function update(success, table){
      $scope.table = table || placeholder;
      $scope.renderSidebar = success;
      $scope.renderSchema = success;
      timeout = $timeout(fetch, refreshInterval);
    };

    // Table Schema
    var tableStmt = "select column_name, data_type from information_schema.columns " +
          "where schema_name=$1 and table_name=$2";
    SQLQuery.execute(tableStmt, [schemaName, tableName]).success(function(query){
      $scope.schemaHeaders = query.cols;
      $scope.schemaRows = query.rows;
      $scope.renderSchema = true;
    }).error(function(query){
      $scope.renderSchema = false;
    });

    $scope.$on('$destroy', function(){
      $timeout.cancel(timeout);
    });

    // Initial
    $scope.table = null;
    fetch();
    $scope.renderSidebar = true;
    $scope.renderSchema = false;
    $scope.renderPartitions = false;

  })
  .controller('TableListController', function ($scope, $location, $log, $timeout, $routeParams,
        SQLQuery, queryResultToObjects, roundWithUnitFilter, bytesFilter, TableInfo, TabNavigationInfo, PartitionsTableController) {

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

    var selected = $routeParams.table_name || '';

    var TableInfoProvider = {
      setEmpty: function setEmpty() {
        $scope.tables = [];
        $scope.selected_table = '';
        $scope.renderSidebar = false;
      },
      update: function update(success, tables, shards) {
        var _tables = tables || [];
        var _shards = shards || [];

        if (success && _tables.length) {
          $scope.renderSidebar = true;
          $scope.renderSchema = true;

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

          _tables = _tables.sort(compareListByHealth);

          $scope.tables = [
            {
              "display_name": "Tables",
              "tables": _tables.filter(function(item, idx){ return item.schema_name == 'doc'; }),
              "schema_name": "doc"
            },
            {
              "display_name": "Blob Tables",
              "tables": _tables.filter(function(item, idx){ return item.schema_name == 'blob'; }),
              "schema_name": "blob"
            }
          ];

          $scope.selected_table = selected;

        } else {
          TableInfoProvider.setEmpty();
        }
        timeout = $timeout(TableInfoProvider.fetch, refreshInterval);
      },
      fetch: function fetch() {
        $timeout.cancel(timeout);
        console.log('fetch', new Date());
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
            var shards = queryResultToObjects(shardQuery, ['table_name', 'partition_ident', 'schema_name', 'sum_docs', 'primary', 'avg_docs', 'count', 'state', 'size']);
            TableInfoProvider.update(true, tables, shards);
          }).error(function(sqlQuery) {
            var tables = queryResultToObjects(tableQuery, ['name', 'shards_configured', 'replicas_configured', 'schema_name', 'partitioned_by']);
            TableInfoProvider.update(true, tables);
          });

          }).error(function(sqlQuery) {
            TableInfoProvider.update(false);
          });

      }
    };

    $scope.renderSidebar = true;
    TableInfoProvider.fetch();

    $scope.$on('$destroy', function(){
      $timeout.cancel(timeout);
    });

    $scope.isActive = function (table_name) {
      return table_name === $scope.selected_table;
    };

    var healthPriorityMap = {
      'good': 2,
      'warning': 1,
      'critical': 0,
      '--': 0
    };

    function compareListByHealth(a,b) {
      if (healthPriorityMap[a.health] < healthPriorityMap[b.health]) return -1;
      if (healthPriorityMap[a.health] > healthPriorityMap[b.health]) return 1;
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    }

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

