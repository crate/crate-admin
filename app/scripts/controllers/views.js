'use strict';

angular.module('views', ['stats', 'sql', 'common', 'viewinfo', 'events'])
  .provider('TabNavigationInfo', function () {
    this.collapsed = [false, true]; // must match $scope.views of TablesController
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
  .directive('views', function () {
    return {
      restrict: 'E',
      replace: true,
      scope: {},
      templateUrl: 'static/views/views.html',
      controllerAs: 'ViewsController',
      controller: function (ClusterState, $scope, ClusterEventsHandler) {
        var hideIfEmpty = () => {
          $scope.empty = ClusterState.data.views.length === 0;
        };

        // initial state
        hideIfEmpty();

        ClusterEventsHandler.register('STATE_REFRESHED', 'ViewsController', hideIfEmpty);

        $scope.$on('$destroy', function () {
          ClusterEventsHandler.remove('STATE_REFRESHED', 'ViewsController');
        });
      }
    };
  })
  .directive('viewDetail', function () {
    return {
      restrict: 'E',
      replace: true,
      scope: {},
      templateUrl: 'static/views/view-detail.html',
      controllerAs: 'ViewDetailController',
      controller: function ($scope, $location, $log, $timeout, $state,
        SQLQuery, queryResultToObjects, roundWithUnitFilter, bytesFilter, ViewList,
        ClusterEventsHandler, ClusterState) {

        const NESTED_COL_REGEX = /([^\s]+)(\[\'([^\s]+)\'])+/i;
        const COLUMNS_QUERY = 'SELECT column_name, upper(data_type) AS column_type ' +
          'FROM information_schema.columns ' +
          'WHERE table_schema = ? AND table_name = ?';

        $scope.executeQuery = (query) => {
          $location.search({'query': query});
          $location.path('/console');
        };

        // sidebar button handler (mobile view)
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
          var query = 'SELECT ';
          var cols = rows
            .filter((row) => !isNestedColumn(row.column_name))
            .map((row) => '"' + row.column_name + '"');

          query += cols.join(', ');
          query += ' FROM "' + schema + '"."' + name + '" LIMIT 100;';
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

        var updateView = () => {
          var name = $state.params.name;
          var schema = $state.params.schema;
          var views = ClusterState.data.views;

          var hasViews = views.length > 0;
          $scope.renderSidebar = hasViews;
          $scope.nothingSelected = !hasViews;
          if (hasViews) {
            var current = views.filter((o) => o.name == name && o.schema == schema);
            current = current.length ? current[0] : views[0];
            $scope.view = current;
            $scope.view.label = current.schema + '.' + current.name;

          } else {
            $scope.view = null;
            $scope.columns = [];
          }
        };

        ClusterEventsHandler.register('STATE_REFRESHED',
          'ViewDetailController',
          updateView);

        $scope.$on('$destroy', function () {
          ClusterEventsHandler.remove('STATE_REFRESHED', 'ViewDetailController');
        });

        updateView();
        render($state.params.schema, $state.params.name);
      }
    };
  })
  .directive('viewList', function () {
    return {
      restrict: 'E',
      replace: true,
      scope: {},
      templateUrl: 'static/views/viewlist.html',
      controllerAs: 'ViewListController',
      controller: function ($scope, $state, TabNavigationInfo, ClusterEventsHandler, ClusterState) {
        $scope.collapsed = true;

        $scope.viewFilter = (item) => {
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
          for (idx in $scope.views) {
            toggleClasses(idx);
            TabNavigationInfo.collapseIndex(idx);
          }
          $scope.collapsed = true;
        };

        $scope.unCollapseAll = () => {
          var idx;
          for (idx in $scope.views) {
            toggleClasses(idx);
            TabNavigationInfo.unCollapseIndex(idx);
          }
          $scope.collapsed = false;
        };

        var filterBySchemaName = (schema) => (o) => o.schema === schema;

        var updateViewList = () => {
          var views = ClusterState.data.views;
          var hasViews = views.length > 0;
          $scope.renderSidebar = hasViews;
          $scope.views = [];
          if (hasViews) {
            // use name and schema from first item
            if (!$scope.name || !$scope.schema) {
              $scope.schema = views[0].schema;
              $scope.name = views[0].name;
              $state.go('views.view', {
                schema: $scope.schema,
                name: $scope.name
              });
            }

            var idx,
              name;
            var customSchemas = [];
            for (idx in views) {
              name = views[idx].schema;
              if (name == 'doc' || name == 'blob' || customSchemas.indexOf(name) > -1) {
                continue;
              }
              customSchemas.push(name);
            }

            $scope.views.push({
              display_name: 'Doc',
              views: views.filter(filterBySchemaName('doc')),
              schema: 'doc'
            });
            for (idx in customSchemas) {
              name = customSchemas[idx];
              $scope.views.push({
                display_name: name,
                views: views.filter(filterBySchemaName(name)),
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
          'ViewListController',
          updateViewList);

        $scope.$on('$destroy', function () {
          ClusterEventsHandler.remove('STATE_REFRESHED', 'ViewListController');
        });

        updateViewList();
        render($state.params.schema, $state.params.name);
      }
    };
  });
