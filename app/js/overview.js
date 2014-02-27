define(['jquery',
        'underscore',
        'backbone',
        'base',
        'text!views/overview.html',
        'bootstrap'
    ], function ($, _, Backbone, base, OverviewTemplate) {

    var Overview = {};

    Overview.OverviewView = base.CrateView.extend({

        id: 'page-wrapper',
        template: _.template(OverviewTemplate),

        initialize: function () {
            this.listenTo(this.model, 'change:loadHistory', this.updateLoadGraph);
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

        updateLoadGraph: function (loadHistory) {
        },

        render: function () {
            var i, lh, data=[];

            this.$el.html(this.template(this.model.toJSON()));

            lh = this.model.get('loadHistory')[0];
            for (i=0; i<lh.length; i++) {
                data.push([i, lh[i]]);
            }

           $.plot(this.$('#load-graph'), [{label: 'cluster load', data: data}], {

                series: {
                    shadowSize: 0   // Drawing is faster without shadows
                },
                lines: { show: true, fill: true },
                yaxis: {
                    min: 0,
                },
                xaxis: {
                    min: 0,
                    max: 100,
                    show: false
                }
            }).draw();

            return this;
        }
    });

    return Overview;
});
