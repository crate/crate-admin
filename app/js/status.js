define(['jquery',
        'underscore',
        'backbone',
        'base',
        'SQL',
        'text!views/statusbar.html',
        'bootstrap',
        'flot'
    ], function ($, _, Backbone, base, SQL, StatusBarTemplate) {

    var Status = {};

    Status._refreshTimeout = 5000; // msec

    Status._loadHistoryLen = 100; // 100 points of 5sec

    Status.ClusterStatus = Backbone.Model.extend({

        defaults: {
            cluster_name: '',
            cluster_state: '',
            load: ['-.-', '-.-', '-.-'],
            replicated_data: 0,
            available_data: 0,
            records_unavailable: 0,
            loadHistory: [[], [], []]
        },

        initialize: function (options) {
            options = options || {};
            this.host = options.host || '';
        },

        _updateLoadHistory: function (load) {
            var lh = this.get('loadHistory'), i;

            for (i=0; i<3; i++) {
                lh[i].push(load[i]);
                lh[i] = lh[i].splice(-Status._loadHistoryLen, Status._loadHistoryLen);
            }
            this.set('loadHistory', lh);
            this.trigger('change:loadHistory', lh);
        },

        fetch: function () {
            var self = this, load, sqNodes, i;

            sqNodes = new SQL.Query(
                    'select ' +
                    '   sys.cluster.name, ' +
                    '   sum(load[\'1\']), ' +
                    '   sum(load[\'5\']), ' +
                    '   sum(load[\'15\']), ' +
                    '   count(*) ' +
                    'from sys.nodes group by sys.cluster.name');
            sqNodes = sqNodes.execute();
            $.when(sqNodes).done(function (nodes) {
                var row = nodes.rows[0];
                var numNodes = row[4];
                var load = [0.0, 0.0, 0.0];
                for (i = 0; i < 3; i++) {
                    load[i] = row[i + 1] / numNodes;
                }
                self._updateLoadHistory(load);
                for (i=0 ; i<3 ; i++) {
                    load[i] = load[i].toFixed(2);
                }
                self.set({
                    cluster_name: row[0],
                    load: load
                });
            }).fail(function () {
                delete self.data;
            });
            setTimeout(function () { self.fetch(); }, Status._refreshTimeout);
        },

    });


    Status.StatusView = base.CrateView.extend({

        el: '#topstatusbar',
        template: _.template(StatusBarTemplate),
        model: Status.ClusterStatus,

        initialize: function (options) {
            this.tables = options.tables;
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.tables, 'change', this.render);
            this.listenTo(this.tables, 'reset', this.render);
            this.listenTo(this.tables, 'add', this.render);
            this.listenTo(this.tables, 'remove', this.render);
        },

        render: function () {
            var json = this.model.toJSON();
            json.cluster_state = this.tables.health();
            this.$el.html(this.template(json));
            return this;
        }
    });

    return Status;
});
