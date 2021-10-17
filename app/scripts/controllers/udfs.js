'use strict';

angular.module('udfs', ['stats', 'sql', 'common', 'udfinfo', 'events'])
  .provider('TabNavigationInfo', function () {
    this.collapsed = [false, true]; // must match $scope.udfs of TablesController
    this.$get = () => {
      var collapsed = this.collapsed;
      return {
        'collapsed': collapsed,
        'toggleIndex': (i) => {
          collapsed[i] = !collapsed[i];
        },
        'collapseIndex': (i) => {
          collapsed[i] = true;
        },
        'unCollapseIndex': (i) => {
          collapsed[i] = false;
        }
      };
    };
  })
  .directive('udfs', function () {
    return {
      restrict: 'E',
      replace: true,
      scope: {},
      templateUrl: 'static/views/udfs.html',
      controllerAs: 'UdfsController',
      controller: function (ClusterState, $scope, ClusterEventsHandler) {
        var hideIfEmpty = () => {
          $scope.empty = ClusterState.data.udfs.length === 0;
        };

        // initial state
        hideIfEmpty();

        ClusterEventsHandler.register('STATE_REFRESHED', 'UdfsController', hideIfEmpty);

        $scope.$on('$destroy', function () {
          ClusterEventsHandler.remove('STATE_REFRESHED', 'UdfsController');
        });
      }
    };
  })
  .directive('udfDetail', function () {
    return {
      restrict: 'E',
      replace: true,
      scope: {},
      templateUrl: 'static/views/udf-detail.html',
      controllerAs: 'UDFDetailController',
      controller: function ($scope, $location, $log, $timeout, $state,
        SQLQuery, queryResultToObjects, roundWithUnitFilter, bytesFilter, UdfList,
        ClusterEventsHandler, ClusterState) {

        const NESTED_COL_REGEX = /([^\s]+)(\[\'([^\s]+)\'])+/i;
        const COLUMNS_QUERY = 'SELECT quote_ident(column_name) as column_name, upper(data_type) AS column_type ' +
          'FROM information_schema.columns ' +
          'WHERE table_schema = ? AND table_name = ?';

        $scope.executeQuery = (query) => {
          $location.search({'query': query});
          $location.path('/console');
        };

        // sidebar button handler (mobile udf)
        $scope.toggleSidebar = function () {
          $('#page-viewport')
            .toggleClass('show-sidebar');
          $('.menu-toggle i.fa')
            .toggleClass('fa-angle-double-right')
            .toggleClass('fa-angle-double-left');
        };

        // bind tooltips
        $('[rel=tooltip]').tooltip({
          placement: 'top'
        });

        var isNestedColumn = (col) => col.match(NESTED_COL_REGEX);

        var constructQuery = (schema, name, rows) => {
          var query = 'CREATE OR REPLACE FUNCTION "' + schema + '"."' + name + '"';
          query += '\nRETURNS ';
          query += '\nLANGUAGE ' + 'JAVASCRIPT';
          query += '\nAS ';
          query += '\n\'' + 'function';
          query += '\n\';';
          return query;
        };

        var render = (schema, name) => {
          $scope.nothingSelected = false;
          $scope.renderSiderbar = true;

          if (schema && name) {
            SQLQuery.execute(COLUMNS_QUERY, [schema, name], false, false, false, false)
              .then((q) => {
                $scope.columns = queryResultToObjects(q, q.cols);
                $scope.query = constructQuery(schema, name, $scope.columns);
              }, () => {
                $scope.columns = [];
              });
          }
        };

        var updateUDF = () => {
          var name = $state.params.name;
          var schema = $state.params.schema;
          var udfs = ClusterState.data.udfs;

          var hasUdfs = udfs.length > 0;
          $scope.renderSidebar = hasUdfs;
          $scope.nothingSelected = !hasUdfs;
          if (hasUdfs) {
            var current = udfs.filter((o) => o.name == name && o.schema == schema);
            current = current.length ? current[0] : udfs[0];
            $scope.udf = current;
            $scope.udf.label = current.schema + '.' + current.name;

          } else {
            $scope.udf = null;
            $scope.columns = [];
          }
        };

        ClusterEventsHandler.register('STATE_REFRESHED',
          'UDFDetailController',
          updateUDF);

        $scope.$on('$destroy', function () {
          ClusterEventsHandler.remove('STATE_REFRESHED', 'UDFDetailController');
        });

        updateUDF();
        render($state.params.schema, $state.params.name);
      }
    };
  })
  .directive('udfList', function () {
    return {
      restrict: 'E',
      replace: true,
      scope: {},
      templateUrl: 'static/views/udflist.html',
      controllerAs: 'UdfListController',
      controller: function ($scope, $state, TabNavigationInfo, ClusterEventsHandler, ClusterState) {
        $scope.collapsed = true;

        $scope.udfFilter = (item) => {
          return (!$scope.search || (item.fqn.toLowerCase().indexOf($scope.search) != -1));
        };

        $scope.clearFilter = function () {
            $scope.search = '';
          };

        $scope.isActive = (schema, name) => {
          return name === $state.params.name && schema === $state.params.schema;
        };

        var toggleClasses = (i) => {
          $('#nav-tabs-' + i)
            .collapse('toggle');
          $('#nav-tabs-header-' + i + ' i.fa')
            .toggleClass('fa-caret-down')
            .toggleClass('fa-caret-right');
        };

        $scope.toggleElements = (i) => {
          toggleClasses(i);
          TabNavigationInfo.toggleIndex(i);
        };

        $scope.isCollapsed = (i) => {
          return TabNavigationInfo.collapsed[i];
        };

        $scope.collapseAll = () => {
          var idx;
          for (idx in $scope.udfs) {
            toggleClasses(idx);
            TabNavigationInfo.collapseIndex(idx);
          }
          $scope.collapsed = true;
        };

        $scope.unCollapseAll = () => {
          var idx;
          for (idx in $scope.udfs) {
            toggleClasses(idx);
            TabNavigationInfo.unCollapseIndex(idx);
          }
          $scope.collapsed = false;
        };

        var filterBySchemaName = (schema) => (o) => o.schema === schema;

        var updateUdfList = () => {
          var udfs = ClusterState.data.udfs;
          var hasUdfs = udfs.length > 0;
          $scope.renderSidebar = hasUdfs;
          $scope.udfs = [];
          if (hasUdfs) {
            // use name and schema from first item
            if (!$scope.name || !$scope.schema) {
              $scope.schema = udfs[0].schema;
              $scope.name = udfs[0].name;
              $state.go('udfs.udf', {
                schema: $scope.schema,
                name: $scope.name
              });
            }

            var idx,
              name;
            var customSchemas = [];
            for (idx in udfs) {
              name = udfs[idx].schema;
              if (name == 'doc' || name == 'blob' || customSchemas.indexOf(name) > -1) {
                continue;
              }
              customSchemas.push(name);
            }

            $scope.udfs.push({
              display_name: 'Doc',
              udfs: udfs.filter(filterBySchemaName('doc')),
              schema: 'doc'
            });
            for (idx in customSchemas) {
              name = customSchemas[idx];
              $scope.udfs.push({
                display_name: name,
                udfs: udfs.filter(filterBySchemaName(name)),
                schema: name
              });
            }
          }
        };

        var render = (schema, name) => {
          $scope.name = name;
          $scope.schema = schema;
          $scope.renderSidebar = true;
        };

        ClusterEventsHandler.register('STATE_REFRESHED',
          'UdfListController',
          updateUdfList);

        $scope.$on('$destroy', function () {
          ClusterEventsHandler.remove('STATE_REFRESHED', 'UdfListController');
        });

        updateUdfList();
        render($state.params.schema, $state.params.name);
      }
    };
  });
