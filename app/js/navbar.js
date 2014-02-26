define(['jquery',
        'underscore',
        'backbone',
        'base',
        'text!views/navbar.html',
        'bootstrap'
    ], function ($, _, Backbone, base, NavBarTemplate) {

    var NavBar = {};

    NavBar.NavBarView = base.CrateView.extend({

        el: 'ul.side-nav',
        template: _.template(NavBarTemplate),

        render: function () {
            this.$el.html(this.template());
            return this;
        }

    });

    return NavBar;
});
