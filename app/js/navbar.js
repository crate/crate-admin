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

        selectActive: function (route) {
            this.$('li.active').removeClass('active');
            this.$('#nav-' + route).addClass('active');
        },

        render: function () {
            this.$el.html(this.template());
            return this;
        }

    });

    return NavBar;
});
