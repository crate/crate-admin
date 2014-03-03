/*jshint multistr: true */

define(['jquery',
        'underscore',
        'base',
        'SQL',
        'text!views/tutorial.html'
       ],function ($, _, base, SQL, TutorialTemplate) {

    var Tutorial = {};

    var base_url = "https://twitter.crate.io/api/v1";
    var crate_url = "http://localhost:4200/";
    var host = location.href;
    if (!host) {
      host = "http://localhost:4200/admin";
    }

    var Twitter = function () {
        this.oReq = new XMLHttpRequest();
        this.tweets = 0;

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
                tweets;

            this.createTable();

            // This is a long polling request.
            // We do not expect this to ever complete, except on timeout and just parse the
            // continously updating response for new tweets to insert.
            $.ajax(base_url + "/sample?origin="+host, {
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
                        currentResponseText = evt.target.responseText;
                    });
                    return xhr;
                }
            })
            .fail(function () {
                window.location = base_url + "/auth?origin="+host;
            })
            .done(function () {
                self.start();
                console.log('timeout');
            });

      };

      this.running = function() {
            return this.oReq.readyState !== 0 && this.oReq.readyState != 4;
      };

      this.stop = function() {
          this.oReq.abort();
          this.tweets = 0;
      };
    };

    twitter = new Twitter();
    // The authentication callback sets the start_twitter parameter after
    // a successfull login
    // so the user doesn't have to click the button again
    if (location.search.split('start_twitter=')[1] == 'true'){
      twitter.start();
    }

    Tutorial.TutorialView = base.CrateView.extend({
        template: _.template(TutorialTemplate),
        events: {
            'submit form': 'start'
        },

        updateBtn: function(){
            if(!twitter.running()){
                $('button').text('Give me some Tweets');
                $('#tweets').hide();
            } else {
                $('button').text('Stop indexing Tweets');
                $('#tweets').show();
            }
        },

        start: function(ev){
            if (twitter.running()){
                twitter.stop();
            }else {
                twitter.start();
            }
            this.updateBtn();
            ev.preventDefault();
            ev.stopPropagation();
        },

        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }

    });

    return Tutorial;
});
