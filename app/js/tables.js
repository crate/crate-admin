define(['jquery',
        'underscore',
        'backbone',
        'base',
        'SQL',
        'text!views/tablelist.html',
        'text!views/tablelistitem.html',
        'text!views/tableinfo.html',
        'bootstrap',
    ], function ($, _, Backbone, base, SQL, TableListTemplate, TableListItemTemplate, TableInfoTemplate) {

    var Tables = {};

    Tables.TableInfo = Backbone.Model.extend({
        idAttribute: 'name',

        primaryShards: function () {
            return _.filter(this.get('shardInfo'), function (node) {
                return node.primary;
            });
        },

        size: function () {
            return _.reduce(this.primaryShards(), function (memo, shard) {
                return memo + shard.size;
            }, 0);
        },

        totalRecords: function () {
            return _.reduce(this.primaryShards(), function (memo, shard) {
                return memo + shard.records_total;
            }, 0);
        },

        missingShards: function () {
            var shards = _.filter(this.get('shardInfo'), function (shard) {
                return shard.state == 'UNASSIGNED' && shard.primary;
            });
            return _.reduce(shards, function(memo, shard) {return shard.shards_active + memo; }, 0);
        },

        underreplicatedShards: function () {
            var shards = _.filter(this.get('shardInfo'), function (shard) {
                return shard.state == 'UNASSIGNED' && !shard.primary;
            });
            return _.reduce(shards, function(memo, shard) {return shard.shards_active + memo; }, 0);
        },

        startedShards: function () {
            var shards = _.filter(this.get('shardInfo'), function (shard) {
                return shard.state == 'STARTED';
            });
            return _.reduce(shards, function(memo, shard) {return shard.shards_active + memo; }, 0);
        },

        underreplicatedRecords: function () {
            if (this.underreplicatedShards() === 0) {
                return 0;
            }
            if (this.primaryShards().length === 0) {
                return '--';
            }
            return this.underreplicatedShards() * _.first(this.primaryShards()).avg_docs;
        },

        unavailableRecords: function () {
            if (this.missingShards() === 0) {
                return 0;
            }

            var shard = _.find(this.get('shardInfo'), function (shard) {
                return shard.state === 'STARTED';
            });
            return shard.avg_docs * this.missingShards();
        },

        health: function () {
            if (this.primaryShards().length === 0) {
                return 'critical';
            }
            if (this.missingShards() > 0) {
                return 'critical';
            }
            if (this.underreplicatedShards() > 0) {
                return 'warning';
            }
            return 'good';
        }

    });

    Tables.TableList = Backbone.Collection.extend({

        model: Tables.TableInfo,

        fetch: function () {
            var self = this,
                sqInfo, sqShardInfo, sqColumns, dInfo, dShardInfo, dColumns, d;

            d = $.Deferred();
            sqInfo = new SQL.Query(
                'select table_name, sum(number_of_shards), sum(number_of_replicas) ' +
                'from information_schema.tables ' +
                'group by table_name');

            sqShardInfo = new SQL.Query(
                'select table_name, sum(num_docs), "primary", avg(num_docs), count(*), state, sum(size) '+
                'from sys.shards group by table_name, "primary", state ' +
                'order by table_name, "primary"');

            sqColumns = new SQL.Query(
                'select table_name, column_name, data_type ' +
                'from information_schema.columns order by ordinal_position'
            );

            dInfo = sqInfo.execute();
            dShardInfo = sqShardInfo.execute();
            dColumns = sqColumns.execute();

            $.when(dInfo, dShardInfo, dColumns).then(function (info, shardInfo, columns) {
                // Collect and assemble list of tables as objects
                var tables = _.map(info[0].rows, function (row) {
                    return _.object(['name', 'shards_configured', 'replicas_configured'], row);
                });

                shardInfo = _.map(shardInfo[0].rows, function (row) {
                    return _.object(['name', 'records_total', 'primary', 'avg_docs', 'shards_active', 'state', 'size'], row);
                });

                tables = _.map(tables, function (table) {
                    table.shardInfo = _.filter(shardInfo, function (si) { return si.name === table.name; } );
                    return table;
                });

                columns = _.map(columns[0].rows, function (row) {
                    return _.object(['table_name', 'column_name', 'data_type'], row);
                });

                columns = _.groupBy(columns, function (column) { return column.table_name; });

                // Reject system tables
                // select table_name from information_schema.tables where schema_name='doc'
                tables = _.reject(tables, function (table) {
                    return _.contains(['tables', 'shards', 'columns', 'cluster', 'nodes'], table.name);
                });

                _.each(tables, function (table) {
                    table.columns = columns[table.name];
                });

                self.reset(tables);
                d.resolve(tables);
            }, d.reject);
            return d.promise();
        }

    });

    Tables.TableListView = base.CrateView.extend({

        initialize: function () {
            this.listenTo(this.collection, 'reset', this.render);
        },

        template: _.template(TableListTemplate),

        deactivateAll: function () {
            this.$('li').removeClass('active');
        },

        showDetails: function (name) {
            var t = this.collection.get(name),
                v = new Tables.TableInfoView({model: t});
            this.$('#table-info').html(v.render().$el);
        },

        render: function () {
            var self = this;

            this.$el.html(this.template());
            _.each(this.collection.models, function (table) {
                var v = new Tables.TableListItemView({model: table});
                self.$('ul').append(v.render().$el);
                self.addView(table.get('name'), v);
            });
            return this;
        }
    });

    Tables.TableListItemView = base.CrateView.extend({

        tagName: 'li',

        template: _.template(TableListItemTemplate),

        events: {
            'click ': 'selectTable'
        },

        selectTable: function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            this.parentView.deactivateAll();
            this.$el.addClass('active');
            this.parentView.showDetails(this.model.get('name'));

        },

        summary: function () {
            // Show in the summary the size of the "primary" shards
            return base.humanReadableSize(this.model.size());
        },


        render: function () {
            var data = this.model.toJSON();
            data.health = this.model.health();
            this.$el.html(this.template(data));
            return this;
        }
    });

    Tables.TableInfoView = base.CrateView.extend({

        template: _.template(TableInfoTemplate),


        render: function () {
            var data = this.model.toJSON();
            data.missingShards = this.model.missingShards();
            data.startedShards = this.model.startedShards();
            data.tableSize = base.humanReadableSize(this.model.size());
            data.totalRecords = this.model.totalRecords();
            data.underreplicatedShards = this.model.underreplicatedShards();
            data.underreplicatedRecords = this.model.underreplicatedRecords();
            data.unavailableRecords = this.model.unavailableRecords();
            data.health = this.model.health();
            this.$el.html(this.template(data));
            return this;
        }

    });

    return Tables;
});
