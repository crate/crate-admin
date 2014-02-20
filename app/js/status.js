define(['jquery',
        'underscore',
        'backbone',
        'base',
        'SQL',
        'text!views/statusbar.html',
        'bootstrap'
    ], function ($, _, Backbone, base, SQL, StatusBarTemplate) {

    var Status = {}

    Status.ClusterStatus = Backbone.Model.extend({

        defaults: {
            cluster_name: '',
            cluster_state: '',
            cluster_color_label: 'label-default',
            load: ['-.-', '-.-', '-.-']
        },

        _clusterLoad: function (nodes) {
            var nodes_count = 0;
            var load = [0.0, 0.0, 0.0];
            for (var node in nodes) {
                nodes_count++;
                for (var i=0; i<3; i++) {
                    load[i] = load[i]+nodes[node].os.load_average[i];
                }
            }
            for (var i=0; i<3; i++) {
                load[i] = load[i]/nodes_count;
                load[i] = load[i].toFixed(2);
            }
            return load;
        },

        _updateHealth: function () {
            var self = this,
                sq;

            sq = new SQL.Query("select sum(number_of_shards) from information_schema.tables")
            sq.execute().done(function (res) {
                var configuredShards = 0;
                if (res.rowcount > 0) {
                    configuredShards = res.rows[0][0];
                }

                sq = new SQL.Query('select count(*), "primary", state from stats.shards group by "primary", state');
                sq.execute().done(function (res) {
                    var activePrimaryShards = 0;
                    var unassignedShards = 0;
                    for (var row in res.rows) {
                        if (res.rows[row][1] == true && res.rows[row][2] in {'STARTED':'', 'RELOCATING':''} ) {
                            activePrimaryShards = res.rows[row][0];
                        } else if (res.rows[row][2] == 'UNASSIGNED') {
                            unassignedShards = res.rows[row][0];
                        }
                    }
                    if (activePrimaryShards < configuredShards) {
                        self.set({
                            cluster_state: 'red',
                            cluster_color_label: 'label-error'
                        });

                    } else if (unassignedShards > 0) {
                        self.set({
                            cluster_state: 'yellow',
                            cluster_color_label:'label-warning'
                        });
                    } else {
                        self.set({
                            cluster_state: 'green',
                            cluster_color_label: 'label-success'
                        });
                    }
                });
            }).fail(function (err) {});
        },

        fetch: function () {
            var self = this,
                load;
            $.get('/_nodes/stats?all=true')
                .done(function (data) {
                    self.set({
                        cluster_name: data.cluster_name,
                        load: self._clusterLoad(data.nodes)
                    });
                })
                .error(function() {
                    delete self.data;
                });
            this._updateHealth();
            setTimeout(function () { self.fetch(); }, 5000);
        },

    });


    Status.StatusView = base.CrateView.extend({

        el: '#statusbar',
        template: _.template(StatusBarTemplate),
        model: Status.ClusterStatus,

        initialize: function () {
            this.listenTo(this.model, 'change', this.render);
        },

        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });

    return Status;
});
