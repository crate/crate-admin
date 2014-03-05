define([
    'jquery',
    'underscore',
    'backbone',
    'Status',
    'NavBar',
    'Overview',
    'Console',
    'Tables',
    'Cluster',
    'Tutorial'
], function ($, _, Backbone, Status, NavBar, Overview, Console, Tables, Cluster, Tutorial) {

    var app = _.extend({

        root: '/_plugin/crate-admin',
        refreshTimeout: null,

        currentViews: [],

        start: function () {
            var sb, ov;
            // Setup
            app.status = new Status.ClusterStatus();
            app.status.fetch();
            app.Tables = new Tables.TableList();
            app.Tables.fetch({reset: true});

            sb = new Status.StatusView({model: app.status});
            sb.render();
            app.navbar = new NavBar.NavBarView();
            app.navbar.render();
            app.router = new Router();
            app.initializeRouter();

        },

        initializeRouter: function () {
            // Disable browser pushState, use hash changes to navigate
            Backbone.history.start({ pushState: false, root: app.root});

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

        disposeViews: function () {
            var v;
            while (app.currentViews.length>0) {
                v = app.currentViews.pop();
                v.dispose();
            }
        }

    }, Backbone.Events);

    var Router = Backbone.Router.extend({

        routes: {
            '': 'home',
            console: 'console',
            tables: 'tables',
            cluster: 'cluster',
            tutorial: 'tutorial'
        },

        home: function () {
            var v, gv;

            // Check if we just got redirected.
            if (Backbone.history.location.search.indexOf('start_twitter') > -1) {
                document.cookie = 'start_twitter=true; path=/';
                window.location.href = window.location.origin + window.location.pathname  + '#tutorial';
                return;
            }

            app.disposeViews();

            v = new Overview.OverviewView({model: app.status}).render();
            app.currentViews.push(v);
            $('#wrapper').html(v.$el);
            app.navbar.selectActive('overview');
            gv = new Overview.GraphView({model: app.status}).render();
            app.currentViews.push(gv);
            $('#wrapper').append(gv.$el);

        },

        console: function () {
            var v;
            app.disposeViews();

            v = new Console.ConsoleView({model: app.status});
            v.render();
            $('#wrapper').html(v.$el);
            app.navbar.selectActive('console');
        },

        tables: function () {
            var v, tableList;
            app.disposeViews();

            v = new Tables.TableListView({collection: app.Tables}).render();
            app.currentViews.push(v);
            $('#wrapper').html(v.$el);
            app.navbar.selectActive('tables');
        },

        cluster: function () {
            var v, cluster;
            app.disposeViews();

            cluster = new Cluster.Cluster();
            cluster.fetch({reset: true});

            v = new Cluster.ClusterView({collection: cluster});
            app.currentViews.push(v);
            $('#wrapper').html(v.$el);
            app.navbar.selectActive('cluster');
        },

        tutorial: function () {
            var v;
            app.disposeViews();
            v = new Tutorial.TutorialView({model: app.status}).render();
            app.currentViews.push(v);
            $('#wrapper').html(v.$el);
            app.navbar.selectActive('tutorial');
        }
    });

    return app;
});
