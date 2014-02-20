define(['jquery',
        'underscore',
        'backbone',
        'base',
        'text!views/overview.html',
        'bootstrap'
    ], function ($, _, Backbone, base, OverviewTemplate) {

    var Overview = {

        OverviewView: base.CrateView.extend({

            el: '#page-wrapper',
            template: _.template(OverviewTemplate),

            render: function () {
                this.$el.html(this.template());
                return this;
            }
        })
    };

    return Overview;
});
