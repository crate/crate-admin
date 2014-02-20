define([
    'underscore',
    'backbone',
    'jquery',
    'text!views/error.html'
    ], function (_, Backbone, $, ErrorTemplate) {

    // Underscore template settings
    // `{{ variable }}` for escaped text
    // `{< variable >}` for raw html interpolations
    // `{% expression %}` for javascript evaluations
    _.templateSettings = {
          evaluate : /\{%([\s\S]+?)%\}/g,
          escape : /\{\{([\s\S]+?)\}\}/g,
          interpolate : /\{<([\s\S]+?)>\}/g
    };

    var exports = {};

    // CrateView, the mother of all views.

    exports.CrateView = function (options) {
        this.subviews = {};
        Backbone.View.apply(this, [options]);
    };

    _.extend(exports.CrateView.prototype, Backbone.View.prototype, {

        addView: function (id, view) {
            if (this.subviews[id]) {
                this.subviews[id].dispose();
            }
            this.subviews[id] = view;
            view.parentView = this;
        },

        dispose: function () {
            // Dispose all subviews first.
            _.each(this.subviews, function (view, key) {
                this.subviews[key].dispose();
                delete this.subviews[key];
            }, this);

            this.remove(); // uses the default Backbone.View.remove() method which removes this.el from the DOM and removes DOM events.
        }

    });

    exports.CrateView.extend = Backbone.View.extend;

    exports.ErrorFactory = function (msg) {
        var html = _.template(ErrorTemplate);
        return $(html({msg: msg}));
    };


    return exports;
});