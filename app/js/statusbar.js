define(['jquery',
        'underscore',
        'backbone',
        'base',
        'text!views/statusbar.html',
        'bootstrap'
    ], function ($, _, Backbone, base, StatusBarTemplate) {

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

                setTimeout(function () { self.update(); }, 1000);
            },

            render: function () {
                this.$el.html(this.template(this.data || this.default_data));
                return this;
            }
        })
    };

    return StatusBar;
});
