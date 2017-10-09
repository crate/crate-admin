'use strict';

angular.module('shards', ['sql'])
  .factory('ShardService', function (SQLQuery, queryResultToObjects, $q) {
    var ShardService = {
      deferred: $q.defer()
    };

    var stmt = 'SELECT shards.id, size, min_lucene_version, num_docs, orphan_partition,  shards.table_name, shards.schema_name, shards.partition_ident, format(\'%s.%s\', shards.schema_name, shards.table_name) AS fqn, ' +
      'format(\'%s.%s.%s\', shards.schema_name, shards.table_name, shards.partition_ident) AS key, ' +
      '_node[\'id\'] AS node_id, _node[\'name\'] AS node_info_name, _node[\'hostname\'] AS node_info_hostname, _node[\'rest_url\'] AS node_info_rest_url, _node[\'version\'][\'number\'] AS node_info_version, state, routing_state, relocating_node, primary, ' +
      'partitions.values ' +
      'FROM sys.shards AS shards ' +
      'LEFT JOIN information_schema.table_partitions AS partitions ' +
      'ON shards.table_name = partitions.table_name ' +
      'AND shards.partition_ident = partitions.partition_ident ' +
      'ORDER BY key, node_id, id';

    var cols = ['id', 'size', 'min_lucene_version', 'num_docs', 'orphan_partition', 'table_name', 'schema_name', 'partition_ident', 'fqn', 'key', 'node_id', 'node_info_name', 'node_info_hostname', 'node_info_rest_url', 'node_info_version', 'state', 'routing_state', 'relocating_node', 'primary', 'values'];

    ShardService.execute = function () {
      var deferred = $q.defer(),
        promise = deferred.promise;
      SQLQuery.execute(stmt, {}, false, false, true)
        .success(function (query) {
          var result = queryResultToObjects(query, cols);
          deferred.resolve(result);
        })
        .error(function () {
          deferred.reject();
        });

      return promise;
    };

    return ShardService;
  })
  .factory('ShardsIntervalService', function (ShardService, $timeout, $q, $rootScope) {
    var shardsIntervalService = {};
    var poll = function () {
      $q.when(ShardService.execute())
        .then(function (response) {
          shardsIntervalService.response = response;
        }).catch(function () {
          shardsIntervalService.response = [];
        }).finally(function () {
          $rootScope.$broadcast('shard-query-done');
        });
    };
    // Initial poll
    $timeout(poll, 1000);
    shardsIntervalService.refresh = poll;
    return shardsIntervalService;
  })
  .filter('shardStateClass', function () {
    return function (state, primary) {
      var cssClass = '';

      if (primary === true) {
        cssClass = 'cr-shard-primary ';
      }

      switch (state) {
      case 'CREATED':
      case 'STARTED':
      case 'RELOCATED':
        return cssClass + 'cr-shard-state--green';
      case 'INITIALIZING':
      case 'POST_RECOVERY':
        return cssClass + 'cr-shard-state--yellow';
      case 'RECOVERING':
        return cssClass + 'cr-shard-state--red';
      case 'UNASSIGNED':
        return cssClass + 'cr-shard-state--grey';
      default:
        return cssClass + 'cr-shard-state--grey';
      }
    };
  })
  .controller('ShardsController', function ($scope, $q, ShardsIntervalService, $location, $filter, $rootScope, $interval) {
    $scope.idOption = (localStorage.getItem('crate.shards.shard_id_on') || '1') === '1';

    $scope.response = [];
    $scope.selectedShard = '';

    $scope.selectShard = function (key) {
      $scope.selectedShard = key;
      $('.' + key).addClass('selected-shard');
    };

    $scope.unSelectShard = function (key) {
      $scope.selectedShard = '';
      $('.' + key).removeClass('selected-shard');
    };

    $scope.goToUrl = function (path) {
      $location.path(path);
    };


    $scope.showShardIds = function () {
      localStorage.setItem('crate.shards.shard_id_on', $scope.idOption ? '1' : '0');
    };

    function safeApply(scope, fn) {
      var phase = scope.$root.$$phase;
      if (phase == '$apply' || phase == '$digest') {
        scope.$eval(fn);
      } else {
        scope.$apply(fn);
      }
    }

    function setShardData(target) {
      var key = target.data('key');
      $scope.selectShard(key);
      // set tooltip data
      var table_key = target.data('table');
      var node_id = target.data('node');

      var shard = $scope.shards[node_id].shards_by_table[table_key].shards.filter(function (el) {
        return el.key === key;
      })[0];
      $scope.tooltipData = shard;
      $scope.pageX = event.pageX;
      $scope.pageY = event.pageY;
      $scope.displayTooltip = true;
    }

    function setNodeData(target) {
      if (target.data('node') === 'unassigned') {
        //don't display tooltip for unassigned node
        return;
      }
      var node = $scope.shards[target.data('node')].node_info;
      $scope.tooltipData = node;
      $scope.pageX = event.pageX;
      $scope.pageY = event.pageY;
      $scope.displayTooltip = true;
    }

    $('tbody').mousemove(function (event) {
        safeApply($scope, function () {
          if ($scope.displayTooltip) {
            $scope.pageX = event.pageX;
            $scope.pageY = event.pageY;
          }
        });
      })
      .mouseover(function (event) {
        var target = $(event.target);
        if (target.hasClass('shard-number') && !target.parent().hasClass('empty-shard')) {
          target = target.parent();
          $scope.isShard = true;
          safeApply($scope, function () {
            setShardData(target);
          });

        } else if (target.hasClass('shard-item') && !target.hasClass('empty-shard')) {
          $scope.isShard = true;
          safeApply($scope, function () {
            setShardData(target);
          });
        } else if (target.hasClass('shards-table-node') && !target.hasClass('unassigned')) {
          $scope.isShard = false;
          safeApply($scope, function () {
            setNodeData(target);
          });
        } else {
          $scope.displayTooltip = false;
          return;
        }
      })
      .mouseout(function (event) {
        $scope.displayTooltip = false;
        $scope.tooltipData = {};
        $scope.pageX = event.pageX;
        $scope.pageY = event.pageY;
        var target = $(event.target);
        if (target.hasClass('shard-number') && !target.parent().hasClass('empty-shard')) {
          target = target.parent();
          $scope.unSelectShard(target.data('key'));
        } else if (target.hasClass('shard-item') && !target.hasClass('empty-shard')) {
          $scope.unSelectShard(target.data('key'));
        }
        return;
      });

    function sortObjectByKeys(dict) {
      var keys = Object.keys(dict),
        i, len = keys.length,
        new_object = {};

      keys.sort();

      for (i = 0; i < len; i++) {
        var k = keys[i];
        new_object[k] = dict[k];
      }
      return new_object;
    }

    function shardExists(shards, id) {
      var filteredShards = [];
      filteredShards = shards.filter(function (el) {
        if (el.id === id) {
          return true;
        }
      });

      return filteredShards.length !== 0;
    }

    $rootScope.$on('shard-query-done', function () {
      $scope.response = ShardsIntervalService.response;
      $scope.formatShardData();
    });

    $scope.formatShardData = function () {
      $scope.tables = {};
      $scope.tables_partitions = [];
      $scope.schemas = {};
      $scope.shards = {};
      $scope.empty = $scope.response.length === 0 ? true : false;
      $scope.colSpan = 0;
      var old_id = 0;

      var formatted_response = {};

      $scope.response.forEach(function (obj) {

        if (!obj.node_id) {
          obj.node_id = 'unassigned';
        }

        if (!formatted_response[obj.node_id]) {
          formatted_response[obj.node_id] = {};
        }

        var nodeFormat = formatted_response[obj.node_id];

        if (!nodeFormat.shards_by_table) {
          nodeFormat.shards_by_table = {};
        }

        if (!nodeFormat.shards_by_table[obj.key]) {
          nodeFormat.shards_by_table[obj.key] = {};
        }

        if (!nodeFormat.shards_by_table[obj.key].shards) {
          nodeFormat.shards_by_table[obj.key].shards = [];
        }

        // add missing shards as empty space
        while (obj.id > old_id) {
          if (!shardExists(nodeFormat.shards_by_table[obj.key].shards, old_id)) {
            nodeFormat.shards_by_table[obj.key].shards.push({
              'state_class': 'empty-shard',
              'id': old_id,
            });
          }
          old_id += 1;
        }
        // re-init old_id
        old_id = 0;

        nodeFormat.shards_by_table[obj.key].shards.push({
          'state_class': $filter('shardStateClass')(obj.state, obj.primary) + ' ' + [obj.key, obj.id].join('-').replace(/\./g, '-'),
          'key': [obj.key, obj.id].join('-').replace(/\./g, '-'),
          'id': obj.id,
          'size': obj.size,
          'min_lucene_version': obj.min_lucene_version,
          'num_docs': obj.num_docs,
          'primary': obj.primary,
          'relocating_node': obj.relocating_node,
          'routing_state': obj.routing_state,
          'state': obj.state,
          'partition_ident': obj.partition_ident,
          'values': obj.values
        });

        nodeFormat.shards_by_table[obj.key].table_name = obj.table_name;
        nodeFormat.shards_by_table[obj.key].schema_name = obj.schema_name;
        nodeFormat.shards_by_table[obj.key].partition_ident = obj.partition_ident;
        nodeFormat.shards_by_table[obj.key].fqn = obj.fqn;

        if (obj.node_info_name) {
          nodeFormat.node_info = {
            'name': obj.node_info_name,
            'hostname': obj.node_info_hostname,
            'rest_url': obj.node_info_rest_url,
            'version': obj.node_info_version,
            'id': obj.node_id,
          };
        } else {
          nodeFormat.node_info = {
            'name': 'UNASSIGNED'
          };
          nodeFormat.html = '<div> Unassigned Shards</div>';
        }

        return formatted_response;
      });
      $scope.shards = formatted_response;
      $scope.response.forEach(function (el) {
        if ($scope.tables_partitions.indexOf(el.key) === -1) {
          $scope.tables_partitions.push(el.key);
        }
      });

      $scope.tables_partitions.forEach(function (fqn) {

        //make sure all nodes have the same number of columns
        Object.keys(formatted_response).forEach(function (node_id) {
          var shards_by_table = formatted_response[node_id].shards_by_table;

          if (!shards_by_table) {
            shards_by_table = {};
          }
          if (!shards_by_table[fqn]) {
            shards_by_table[fqn] = {};
          }
          if (!shards_by_table[fqn].shards) {
            shards_by_table[fqn].shards = [];
          }
        });

        var fqnParts = fqn.split('.');
        var schemaName = fqnParts[0];
        var schemaTableName = fqn.split('.', 2).join('.');

        // construct table list 
        if (!$scope.schemas[schemaName]) {
          $scope.schemas[schemaName] = 1;
        } else {
          $scope.schemas[schemaName] += 1;
        }

        // construct table list 
        if (!$scope.tables[schemaTableName]) {
          $scope.tables[schemaTableName] = 1;
        } else {
          $scope.tables[schemaTableName] += 1;
        }
      });

      // sort each node column by fqn for consistency
      Object.keys(formatted_response).forEach(function (node_id) {
        formatted_response[node_id].shards_by_table = sortObjectByKeys(formatted_response[node_id].shards_by_table);
      });

      Object.keys($scope.schemas).forEach(function (key) {
        $scope.colSpan += $scope.schemas[key];
      });
    };
    ShardsIntervalService.refresh();
    $interval(ShardsIntervalService.refresh, 5000);
  })
  .directive('shardWrapper', function () {
    return {
      restrict: 'E',
      scope: {
        length: '=length'
      },
      link: function (scope, element) {
        //update number of shards by row
        var numberOfShardsPerColumn = Math.max(3, Math.floor(Math.sqrt(scope.length)));
        element.css({
          'width': numberOfShardsPerColumn * (17 + 5) + 'px'
        });
      }

    };
  })
  .run(function ($window, NavigationService, $translatePartialLoader, $filter, $rootScope, $translate) {

    $translatePartialLoader.addPart('./plugins/shards');
    $translate.refresh();
    var iconSrc = 'plugins/shards/static/icons/icon-shards.svg';
    var url = '/shards';
    var position = 4;

    NavigationService.addNavBarElement(iconSrc, $filter('translate', 'NAVIGATION.PRIVILEGES'), url, position);

    // Update Navbar Elements if Language Changes
    $rootScope.$on('$translateChangeSuccess', function () {
      $translate('NAVIGATION.SHARDS').then(function (translation) {
        NavigationService.updateNavBarElement(url, translation);
      });
    });
  });
