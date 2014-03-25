define(['jquery',
        'underscore',
        'backbone',
        'base',
        'SQL',
        'text!views/tablelist.html',
        'text!views/tablelistitem.html',
        'text!views/tableinfo.html',
        'bootstrap'
    ], function ($, _, Backbone, base, SQL, TableCollectionTemplate, TableCollectionItemTemplate, TableInfoTemplate) {

    var Tables = {};

    Tables._refreshTimeout = 5000;

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
            var activePrimaryShards = _.filter(this.get('shardInfo'), function (shard) {
                return shard.state in {'STARTED':'', 'RELOCATING':''} && shard.primary;
            });
            var numActivePrimaryShards = _.reduce(
                activePrimaryShards,
                function(memo, shard) { return shard.shards_active + memo; },
                0
            );
            return this.get('shards_configured') - numActivePrimaryShards;
        },

	underreplicatedShards: function () {
	    return this.unassignedShards() - this.missingShards();
	},

        unassignedShards: function () {
            var shards = _.filter(this.get('shardInfo'), function (shard) {
                return shard.state == 'UNASSIGNED';
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
	    var primary = this.primaryShards();
            if (primary.length === 0) {
                return 0;
            }
            return this.underreplicatedShards() * _.first(primary).avg_docs;
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
            if (this.unassignedShards() > 0) {
                return 'warning';
            }
            return 'good';
        }

    });

    Tables.TableCollection = Backbone.Collection.extend({

        model: Tables.TableInfo,

        totalRecords: function () {
            return _.reduce(this.models, function (memo, table) {
                return memo + table.totalRecords();
            }, 0);
        },

        underreplicatedRecords: function () {
            return _.reduce(this.models, function (memo, table) {
                return memo + table.underreplicatedRecords();
            }, 0);
        },

        unavailableRecords: function () {
            return _.reduce(this.models, function (memo, table) {
                return memo + table.unavailableRecords();
            }, 0);
        },

        health: function () {
            var healths = _.uniq(_.map(this.models, function (table) { return table.health(); }));
            if (_.contains(healths, 'critical')) {
                return 'critical';
            }
            if (_.contains(healths, 'warning')) {
                return 'warning';
            }
            return 'good';
        },

        comparator: function (item) {
            var health = item.health();

            switch (health) {
                case 'critical':
                    health = '0';
                    break;
                case 'warning':
                    health = '1';
                    break;
                case 'good':
                    health = '2';
                    break;
            }

            return health + item.get('name');
        },

        fetch: function (options) {
            var self = this,
                sqInfo, sqShardInfo, sqColumns, dInfo, dShardInfo, dColumns, d;

            d = $.Deferred();
            sqInfo = new SQL.Query(
                'select table_name, number_of_shards, number_of_replicas ' +
                'from information_schema.tables ' +
                'where schema_name = \'doc\'');

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

            $.when(dInfo, dShardInfo, dColumns).done(function (info, shardInfo, columns) {
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

                _.each(tables, function (table) {
                    table.columns = columns[table.name];
                });

                if (options && options.reset) {
                    self.reset(tables);
                } else {
                    self.set(tables);
                }

                d.resolve(tables);
                // Refresh self after timeout
                setTimeout(function () { self.fetch(); }, Tables._refreshTimeout);
            }).fail(function () {
                setTimeout(function () { self.fetch(); }, Tables._refreshTimeout);
                d.reject();
            });
            return d.promise();
        }

    });

    Tables.TableCollectionView = base.CrateView.extend({

        template: _.template(TableCollectionTemplate),

        initialize: function () {
            var self = this;
            this.listenTo(this.collection, 'reset', this.render);
            this.listenTo(this.collection, 'add', this.addTable);
            this.listenTo(this.collection, 'remove', this.removeTable);
        },

        selectedItem: null,

        deactivateAll: function () {
            this.$('li').removeClass('active');
        },

        showDetails: function (name) {
            if (_.has(this.subviews, 'infoview')) {
                this.subviews.infoview.dispose();
            }

            var t = this.collection.get(name),
                v = new Tables.TableInfoView({model: t});
            this.$('#table-info').html(v.render().$el);
            this.addView('infoview', v);
            this.selectedItem = name;
        },

        addTable: function (table) {
            var prevIndex = this.collection.indexOf(table) - 1,
                v = new Tables.TableCollectionItemView({model: table});

            if (prevIndex >= 0) {
                this.$('#table-'+ this.collection.at(prevIndex).id).after(v.render().$el);
            } else {
                this.$('ul').prepend(v.render().$el);
            }
            this.$('#no-tables').addClass('hidden');
            if (!this.selectedItem ) {
                this.showDetails(table.id);
                this.$('#sidebar-wrapper ul').children().first().addClass('active');
            }
            this.addView(table.id, v);
        },

        removeTable: function (table) {
            if (_.has(this.subviews, table.id)) {
                this.subviews[table.id].dispose();
            }
            if (this.subviews.infoview && this.subviews.infoview.model.id === table.id) {
                this.subviews.infoview.dispose();
                this.selectedItem = null;
            }
            if (this.collection.length===0) {
                this.render();
            }
        },

        render: function () {
            var self = this;

            this.$el.html(this.template());
            _.each(this.collection.models, function (table) {
                self.addTable(table);
            });

            if(this.collection.length===0) {
                this.$('#no-tables').removeClass('hidden');
            }

            return this;
        },

        dispose: function () {
            if (this.subviews.infoview) {
                this.subviews.infoview.dispose();
            }
            base.CrateView.prototype.dispose.call(this);
        }

    });

    Tables.TableCollectionItemView = base.CrateView.extend({

        tagName: 'li',

        template: _.template(TableCollectionItemTemplate),

        events: {
            'click ': 'selectTable'
        },

        initialize: function () {
            this.listenTo(this.model, 'change', this.render);
            this.$el.attr('id', 'table-' + this.model.id);
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

        initialize: function () {
            this.listenTo(this.model, 'change', this.render);
        },

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
