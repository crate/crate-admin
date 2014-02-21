define(['jquery',
        'underscore',
        'backbone',
        'base',
        'SQL',
        'text!views/tablelist.html',
        'text!views/tableinfo.html',
        'bootstrap',
    ], function ($, _, Backbone, base, SQL, TableListTemplate, TableInfoTemplate) {

    var Tables = {};

    Tables.TableInfo = Backbone.Model.extend({

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
                'from stats.shards group by table_name, "primary", state ' +
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
                    table.shardInfo = _.filter(shardInfo, function (si) { return si.name === table.name } );
                    return table;
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

        render: function () {
            this.$el.html(this.template());
            return this;
        }
    });

    Tables.TableInfoView = base.CrateView.extend({

        template: _.template(TableInfoTemplate),

        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }

    });

    return Tables;
});
