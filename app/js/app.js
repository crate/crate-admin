define([
    'jquery',
    'underscore',
    'backbone',
    'Status',
    'NavBar',
    'Overview',
    'Console',
    'Tables',
    'Cluster'
], function ($, _, Backbone, Status, NavBar, Overview, Console, Tables, Cluster) {

    var app = _.extend({

        root: '/_plugin/crate-admin',
        refreshTimeout: null,

        start: function () {
            var sb, ov;
            // Setup
            app.status = new Status.ClusterStatus();
            app.status.fetch();
            sb = new Status.StatusView({model: app.status});
            sb.render();
            app.navbar = new NavBar.NavBarView();
            app.navbar.render();
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
            console: 'console',
            tables: 'tables',
            cluster: 'cluster'
        },

        home: function () {
            if (app.currentView) {
                app.currentView.dispose();
            }
            app.currentView = new Overview.OverviewView({model: app.status});
            app.currentView.render();
            $('#wrapper').html(app.currentView.$el);
            app.navbar.selectActive('overview');
        },

        console: function () {
            if (app.currentView) {
                app.currentView.dispose();
            }
            app.currentView = new Console.ConsoleView({model: app.status});
            app.currentView.render();
            $('#wrapper').html(app.currentView.$el);
            app.navbar.selectActive('console');
        },

        tables: function () {
            if (app.currentView) {
                app.currentView.dispose();
            }
            var tableList = new Tables.TableList();
            tableList.fetch({reset: true});
            app.currentView = new Tables.TableListView({collection: tableList});
            app.currentView.render();
            $('#wrapper').html(app.currentView.$el);
            app.navbar.selectActive('tables');
        },

        cluster: function () {
            if (app.currentView) {
                app.currentView.dispose();
            }
            var cluster = new Cluster.Cluster();
            cluster.fetch({reset: true});
            app.currentView = new Cluster.ClusterView({collection: cluster});
            $('#wrapper').html(app.currentView.$el);
            app.navbar.selectActive('cluster');
        }
    });

    return app;
});
