define(['jquery',
        'underscore',
        'backbone',
        'base',
        'SQL',
        'text!views/statusbar.html',
        'bootstrap'
    ], function ($, _, Backbone, base, SQL, StatusBarTemplate) {

    var StatusBar = {

        StatusBarView: base.CrateView.extend({

            el: '#statusbar',
            template: _.template(StatusBarTemplate),

            events: {
            },

            default_data: {
                cluster_name: '',
                cluster_state: '',
                cluster_color_label: 'label-default',
                load: ['-.-', '-.-', '-.-']
            },

            initialize: function () {
                this.update();
            },

            clusterLoad: function (nodes) {
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

            updateHealth: function () {
                var sq = new SQL.Query("select sum(number_of_shards) from information_schema.tables")
                sq.execute().done(function (res) {
                }).fail(function (err) {
                });
            },

            update: function () {
                var self = this,
                    load;
                $.get('/_nodes/stats?all=true')
                    .done(function (data) {
                        self.data = {
                            cluster_name: data.cluster_name,
                            load: self.clusterLoad(data.nodes),
                            cluster_color_label: '',
                            cluster_state: ''
                        };
                        self.render();
                    })
                    .error(function() {
                        delete self.data;
                    });
                this.updateHealth();
                setTimeout(function () { self.update(); }, 5000);
            },

            render: function () {
                this.$el.html(this.template(this.data || this.default_data));
                return this;
            }
        })
    };

    return StatusBar;
});
