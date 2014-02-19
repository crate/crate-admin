require.config({
    baseUrl: '/_plugin/ca',

    paths: {

        // Libraries
        jquery: './bower_components/jquery/dist/jquery',
        underscore: 'libs/underscore',
        backbone: 'libs/backbone',
    },

    shim: {
        backbone: {
            deps: ['underscore', 'jquery'],
            exports: "Backbone"
        },

        bootstrap: {
            deps: ['jquery']
        },

        underscore: {
            exports: '_'
        }
    }
});

define([
    'jquery'], function ($) {

    // Treat the jQuery ready function as the entry point to the application.
    // Inside this function, kick-off all initialization, everything up to this
    // point should be definitions.
    $(function () {
        debugger;
    });
});
