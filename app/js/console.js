define(['jquery',
        'underscore',
        'backbone',
        'base',
        'SQL',
        'text!views/console.html',
        'bootstrap'
    ], function ($, _, Backbone, base, SQL, ConsoleTemplate) {

    var Console = {};

    Console.ConsoleView = base.CrateView.extend({

        id: 'page-wrapper',
        template: _.template(ConsoleTemplate),

        events: {
            'submit form': 'execute'
        },

        execute: function (ev) {

            var sq,
                self = this,
                stmt = this.$('#query').val();

            ev.preventDefault();
            ev.stopPropagation();
            this.$('.alert').hide();
            sq = new SQL.Query(stmt);
            sq.execute().done(function (res) {
            }).error(function (err) {
            });
        },

        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
            this.$('.alert').hide();
            return this;
        }
    });

    return Console;
});
