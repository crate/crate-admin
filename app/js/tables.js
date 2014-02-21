define(['jquery',
        'underscore',
        'backbone',
        'base',
        'SQL',
        'text!views/tablelist.html',
        'text!views/tableinfo.html',
        'bootstrap',
    ], function ($, _, Backbone, base, SQL, TableTemplate, RowTemplate) {

    var Tables = {};

    Tables.TableList = Backbone.Collection.extend({

        fetch: function () {
            var sqInfo, sqShardInfo, dInfo, dShardInfo, d;
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
                d.resolve(tables);
            }, d.reject);
            return d.promise();
        }

    });

    Tables.TableInfo = Backbone.Model.extend({

    });

    Tables.TableListView = base.CrateView.extend({

    });

    Tables.TableInfoView = base.CrateView.extend({

    });

    return Tables;
});
