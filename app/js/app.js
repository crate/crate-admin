define([
    'jquery',
    'underscore',
    'backbone'
], function ($, _, Backbone) {

    var app = _.extend({

        root: '/_plugin/ca',

        start: function () {
            // Setup
            app.router = new Router();
            app.initializeRouter();
        },

        initializeRouter: function () {
            // Trigger the initial route and enable HTML5 History API support
            Backbone.history.start({ pushState: true, root: app.root});

            // All navigation that is relative should be passed through the navigate
            // method, to be processed by the router.  If the link has a data-bypass
            // attribute, bypass the delegation completely.
            $(document).on('click', 'a:not([data-bypass])', function (evt) {
                // Get the absolute anchor href.
                var href = { prop: $(this).prop("href"), attr: $(this).attr("href") };
                // Get the absolute root.
                var root = location.protocol + "//" + location.host + '/';
                // Ensure the root is part of the anchor href, meaning it's relative.
                if (href.prop && href.prop.slice(0, root.length) === root) {
                    // Stop the default event to ensure the link will not cause a page
                    // refresh.
                    evt.preventDefault();

                    // `Backbone.history.navigate` is sufficient for all Routers and will
                    // trigger the correct events. The Router's internal `navigate` method
                    // calls this anyways.  The fragment is sliced from the root.
                    Backbone.history.navigate(href.attr, true);
                }
            });
        },
    }, Backbone.Events);

    var Router = Backbone.Router.extend({

        routes: {
            '': 'home',
        },

        home: function () {
        }

    });

    return app;
});
