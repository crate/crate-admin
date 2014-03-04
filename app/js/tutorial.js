/*jshint multistr: true */

define(['jquery',
        'underscore',
        'base',
        'SQL',
        'text!views/tutorial.html'
       ],function ($, _, base, SQL, TutorialTemplate) {

    var Tutorial = {};

    var base_url = "https://twitter.crate.io/api/v1";
    var host = location.href;
    if (!host) {
      host = "http://localhost:4200/_plugin/crate-admin";
    }

    var Twitter = function () {

        _.extend(this, Backbone.Events);

        this.count = 0;

        this.storeTweet = function(tweet) {
            var stmt = 'insert into tweets values ($1, $2, $3, $4, $5, $6)',
                sq = new SQL.Query(stmt);

            return sq.execute([
                tweet.created_at,
                tweet.id,
                tweet.retweeted,
                tweet.source,
                tweet.text,
                tweet.user]);
        };

        this.createTable = function() {

            var stmt = ' create table tweets ( \
                    id string primary key, \
                    created_at timestamp, \
                    text string INDEX using fulltext, \
                    source string INDEX using fulltext, \
                    retweeted boolean, \
                    "user" object(strict) as ( \
                        created_at timestamp, \
                        verified boolean, \
                        followers_count integer, \
                        id string, \
                        statuses_count integer, \
                        description string INDEX using fulltext, \
                        friends_count integer, \
                        location string INDEX using fulltext \
                    ) )',
                sq = new SQL.Query(stmt),
                promise = sq.execute();

            return promise;
        };

        this.start = function() {

            var self = this,
                currentResponseText='',
                tweets,
                ctd;

            ctd = this.createTable();

            ctd.always(function () {
                // This is a long polling request.
                // We do not expect this to ever complete, except on timeout and just parse the
                // continously updating response for new tweets to insert.
                self.request = $.ajax(base_url + "/sample?origin="+host, {
                    type: 'GET',
                    xhrFields: {
                        withCredentials: true
                    },
                    crossDomain: true,
                    xhr: function() {
                        var xhr = new window.XMLHttpRequest();
                        xhr.addEventListener("progress", function(evt) {
                            tweets = evt.target.responseText.substring(currentResponseText.length);
                            tweets = tweets.split('\n');
                            tweets = _.map(tweets, function (tweet) {
                                try {
                                    return JSON.parse(tweet);
                                } catch (e) {}
                            });
                            tweets = _.reject(tweets, function (tweet) { return tweet===undefined; });
                            _.each(tweets, function (tweet) {
                                self.storeTweet(tweet);
                            });
                            self.count += tweets.length;
                            self.trigger('change', self.count);
                            currentResponseText = evt.target.responseText;
                        });
                        return xhr;
                    }
                })
                .fail(function (err) {
                    // If this is an authorization failure, redirect to get
                    // permission
                    if (err.status === 401) {
                        window.location = base_url + "/auth?origin="+host;
                    }
                })
                .done(function () {
                    self.start();
                });

                self.trigger('started');
            });
        };

        this.running = function() {
            if (this.request && this.request.state() === 'pending') {
                return true;
            } else {
                return false;
            }
        };

        this.stop = function() {
            this.request.abort();
            this.trigger('stopped');
        };
    };

    twitter = new Twitter();
    // The authentication callback sets the start_twitter parameter after
    // a successfull login so the user doesn't have to click the button again
    if (document.cookie.search('start_twitter=true') > -1){
        document.cookie = 'start_twitter=false; path=/';
        twitter.start();
    }

    Tutorial.TutorialView = base.CrateView.extend({

        id: 'page-wrapper',

        template: _.template(TutorialTemplate),

        events: {
            'click #start-import': 'startImport',
            'click #stop-import': 'stopImport'
        },

        initialize: function () {
            this.listenTo(twitter, 'started', this.render);
            this.listenTo(twitter, 'stopped', this.render);
            this.listenTo(twitter, 'change', this.render);
        },

        startImport: function(ev){
            if (!twitter.running()){
                twitter.start();
            }
            ev.preventDefault();
            ev.stopPropagation();
        },


        stopImport: function(ev){
            if (twitter.running()){
                twitter.stop();
            }
            ev.preventDefault();
            ev.stopPropagation();
        },

        render: function () {
            this.$el.html(this.template({
                count: twitter.count
            }));
            if(!twitter.running()){
                this.$('#import-button').show();
                this.$('#stop-button').hide();
            } else {
                this.$('#import-button').hide();
                this.$('#stop-button').show();
            }
            return this;
        }

    });

    return Tutorial;
});
