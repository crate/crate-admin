define(['jquery',
        'underscore',
        'backbone',
        'base',
        'SQL',
        'text!views/cluster.html',
        'text!views/nodelistitem.html',
        'text!views/nodeinfo.html',
        'bootstrap',
    ], function ($, _, Backbone, base, SQL, ClusterTemplate, NodeListItemTemplate, NodeInfoTemplate) {

    var Cluster = {};

    Cluster.Node = Backbone.Model.extend({
    });

    Cluster.Cluster = Backbone.Collection.extend({

        model: Cluster.Node,

        fetch: function () {
            var self = this,
                sqInfo, sqShardInfo, dInfo, dShardInfo, d;

            d = $.Deferred();
            sqCluster = new SQL.Query('select id, name, hostname, port, load, mem, fs from sys.nodes');
            dCluster = sqCluster.execute();

            dCluster.done(function (res) {
            });

            return d.promise();
        }

    });

    Cluster.ClusterView = base.CrateView.extend({

        initialize: function () {
            this.listenTo(this.collection, 'reset', this.render);
        },

        template: _.template(ClusterTemplate),

        render: function () {
            var self = this;

            this.$el.html(this.template());
            _.each(this.collection.models, function (node) {
                var v = new Cluster.NodeListItemView({model: node});
                self.$('ul').append(v.render().$el);
                self.addView(node.get('name'), v);
            });
            return this;
        }
    });

    Cluster.NodeListItemView = base.CrateView.extend({

        tagName: 'li',

        template: _.template(NodeListItemTemplate),

        events: {
            'click ': 'selectNode'
        },

        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });

    Cluster.NodeInfoView = base.CrateView.extend({

        template: _.template(NodeInfoTemplate),

        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }

    });

    return Cluster;
});
