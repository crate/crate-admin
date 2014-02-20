define(['jquery',
        'underscore',
        'backbone',
        'base',
        'text!views/console.html',
        'bootstrap'
    ], function ($, _, Backbone, base, ConsoleTemplate) {

    var Console = {};

    Console.ConsoleView = base.CrateView.extend({

        id: 'page-wrapper',
        template: _.template(ConsoleTemplate),

        initialize: function () {
            this.listenTo(this.model, 'change', this.render);
        },

        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });

    return Console;
});
