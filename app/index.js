require.config({
    baseUrl: '/_plugin/ca',

    paths: {

        // Libraries
        backbone: 'bower_components/backbone/backbone',
        bootstrap: 'bower_components/bootstrap/dist/js/bootstrap',
        jquery: 'bower_components/jquery/dist/jquery',
        text: 'bower_components/requirejs-text/text',
        underscore: 'bower_components/underscore/underscore',

        // App
        app: 'js/app',
        base: 'js/base',
        SQL: 'js/sql',
        Status: 'js/status'

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
    'jquery', 'app'], function ($, app) {

    // Treat the jQuery ready function as the entry point to the application.
    // Inside this function, kick-off all initialization, everything up to this
    // point should be definitions.
    $(function () {
        app.start();
    });
});
