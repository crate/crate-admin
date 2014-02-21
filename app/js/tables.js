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
            var sqInfo, sqShards, dInfo, dShards, d;
            d = $.Deferred();
            sqInfo = new SQL.Query(
                'select table_name, sum(number_of_shards), sum(number_of_replicas) ' +
                'from information_schema.tables ' +
                'group by table_name');

            sqShards = new SQL.Query(
                'select table_name, sum(num_docs), "primary", avg(num_docs), count(*), state, sum(size) '+
                'from stats.shards group by table_name, "primary", state ' +
                'order by table_name, "primary"');
            dInfo = sqInfo.execute();
            dShards = sqShards.execute();

            $.when(dInfo, dShards).then(function (info, shards) {
                info = _.map(info[0].rows, function (row) {
                    return _.object(['name', 'shards_configured', 'replicas_configured'], row);
                });

                shards = _.map(shards[0].rows, function (row) {
                    return _.object(['name', 'records_total', 'primary', 'avg_docs', 'shards_active', 'state', 'size'], row);
                });
                d.resolve();
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
