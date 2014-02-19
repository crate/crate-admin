define(['jquery',
        'underscore',
        'backbone',
        'text!views/statusbar.html',
        'bootstrap'
    ], function ($, _, Backbone, StatusBarTemplate) {

    var StatusBar = {

        StatusBarView: Backbone.View.extend({

            el: '#statusbar',
            template: _.template(StatusBarTemplate),

            events: {
            },

            data: {},

            initialize: function () {
                this.update();
            },

            update: function () {
                var self = this;
                $.get('/_nodes/stats?all=true')
                    .done(function (data) {
                        self.data = data;
                        self.render();
                    });
                setTimeout(function () { self.update(); }, 1000);
            },

            render: function () {
                this.$el.html(this.template(this.data));
                return this;
            }
        })
    };
    StatusBar.StatusBarView.prototype.template = _.template(StatusBarTemplate);

    return StatusBar;
});
