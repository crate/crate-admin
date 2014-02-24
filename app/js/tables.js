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
        idAttribute: 'name'
    });

    Tables.TableList = Backbone.Collection.extend({

        model: Tables.TableInfo,

        fetch: function () {
            var self = this,
                sqInfo, sqShardInfo, dInfo, dShardInfo, d;

            d = $.Deferred();
            sqInfo = new SQL.Query(
                'select table_name, sum(number_of_shards), sum(number_of_replicas) ' +
                'from information_schema.tables ' +
                'group by table_name');

            sqShardInfo = new SQL.Query(
                'select table_name, sum(num_docs), "primary", avg(num_docs), count(*), state, sum(size) '+
                'from sys.shards group by table_name, "primary", state ' +
                'order by table_name, "primary"');
            dInfo = sqInfo.execute();
            dShardInfo = sqShardInfo.execute();

            $.when(dInfo, dShardInfo).then(function (info, shardInfo) {
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

                // Reject system tables
                // select table_name from information_schema.tables where schema_name='doc'
                tables = _.reject(tables, function (table) {
                    return _.contains(['tables', 'shards', 'columns', 'cluster', 'nodes'], table.name);
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

        healthLabel: function () {
            return '';
        },

        summary: function () {
            // Show in the summary the size of the "primary" node
            var primary = _.find(this.model.attributes.shardInfo, function (node) {
                return node.primary;
            });
            if (primary === undefined) {
                return '';
            }

            return base.humanReadableSize(primary.size);
        },


        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });

    Tables.TableInfoView = base.CrateView.extend({

        template: _.template(TableInfoTemplate),


        primaryTable:function () {
            p =  _.filter(this.model.attributes.shardInfo, function (node) {
                return node.primary;
            });
            return p[0];
        },

        missingShards: function () {
            shards = _.filter(this.model.attributes.shardInfo, function (node) {
                return node.state == 'UNASSIGNED';
            });
            return _.reduce(shards, function(memo, num) {return num.shards_active + memo; }, 0);
        },

        startedShards: function () {
            shards = _.filter(this.model.attributes.shardInfo, function (node) { 
                return node.state == 'STARTED';
            });
            return _.reduce(shards, function(memo, num) {return num.shards_active + memo; }, 0);
        },

        activeShards: function () {
            return 0;
        },

        underreplicatedShards: function () {
            return 0;
        },

        totalRecords: function () {
            return this.primaryTable().records_total;
        },

        replicatedRecords: function () {
            return 0;
        },

        underreplicatedRecords: function () {
            return 0;
        },

        tableSize: function () {
            return this.primaryTable().size;
        },

        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }

    });

    return Tables;
});
