require.config({
    baseUrl: '/_plugin/crate-admin',

    paths: {

        // Libraries
        backbone: 'bower_components/backbone/backbone',
        bootstrap: 'bower_components/bootstrap/dist/js/bootstrap',
        jquery: 'bower_components/jquery/dist/jquery',
        text: 'bower_components/requirejs-text/text',
        underscore: 'bower_components/underscore/underscore',
        spin: 'bower_components/ladda-bootstrap/dist/spin',
        ladda: 'bower_components/ladda-bootstrap/dist/ladda',

        // App
        app: 'js/app',
        base: 'js/base',
        Overview: 'js/overview',
        SQL: 'js/sql',
        Status: 'js/status',
        NavBar: 'js/navbar',
        Console: 'js/console',
        Tables: 'js/tables',
        Cluster: 'js/cluster'
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
