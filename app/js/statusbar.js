define(['jquery',
        'underscore',
        'backbone',
        'text!views/statusbar.html',
        'bootstrap'
    ], function ($, _, Backbone, StatusBarTemplate) {

    var StatusBar = {

        StatusBarView: Backbone.View.extend({

            el: '#statusbar',

            events: {
            },

            initialize: function () {
            },

            data: function () {
                return {};
            },

            render: function () {
                this.$el.html(this.template(this.data()));
                return this;
            }
        })
    };

    StatusBar.StatusBarView.prototype.template = _.template(StatusBarTemplate);

    return StatusBar;
});
