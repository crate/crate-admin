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
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });

    return Overview;
});
