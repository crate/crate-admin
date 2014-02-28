define(['jquery',
        'underscore',
        'backbone',
        'base',
        'text!views/overview.html',
        'text!views/graphview.html',
        'bootstrap'
    ], function ($, _, Backbone, base, OverviewTemplate, GraphViewTemplate) {

    var Overview = {};

    Overview.OverviewView = base.CrateView.extend({

        id: 'page-wrapper',
        template: _.template(OverviewTemplate),

        initialize: function () {
            this.listenTo(this.model, 'change', this.render);
        },

        replicatedStatusClass: function () {
            if (this.model.get('records_underreplicated') > 0){
                return "panel-warning";
            }
            return "";
        },

        availableDataClass: function () {
            if (this.model.get('records_unavailable') > 0){
                return "panel-danger";
            }
            return "";
        },

        render: function () {
            var self = this;
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });

    Overview.GraphView = base.CrateView.extend({

        id: 'graph-wrapper',

        initialize: function () {
            this.listenTo(this.model, 'change:loadHistory', this.setupLoadGraph);
        },

        setupLoadGraph: function (loadHistory) {
            var i, lh, data=[];

            lh = this.model.get('loadHistory')[0];
            for (i=0; i<lh.length; i++) {
                data.push([i, lh[i]]);
            }

            $.plot(this.$('#load-graph'), [{label: 'cluster load', data: data, color: '#676767'}], {

                series: {
                    shadowSize: 0,
                    points: { show: true }
                },
                lines: { show: true, fill: true },
                yaxis: {
                    min: 0,
                },
                xaxis: {
                    min: 0,
                    max: 100,
                    show: false
                },
            }).draw();
        },

        render: function () {
            var self = this;
            this.$el.html(GraphViewTemplate);
            _.defer(function () { self.setupLoadGraph(); });
            return this;
        }

    });

    return Overview;
});
