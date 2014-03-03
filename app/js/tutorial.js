/*jshint multistr: true */

define(['jquery',
        'underscore',
        'base',
        'text!views/tutorial.html'
       ],function ($, _, base, TutorialTemplate) {

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
        this.store_tweet = function(tweet) {
            var http = new XMLHttpRequest();
            var self = this;
            http.open("POST", crate_url + "_sql");
            http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            http.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200){
                    // increase the tweets count if everything is ok
                    self.tweets += 1;
                }
            };

            // store the tweet
            http.send(JSON.stringify({stmt: "insert into tweets values (\$1, \$2, \$3, \$4, \$5, \$6)",
                                      args: [tweet.created_at,
                                             tweet.id,
                                             tweet.retweeted,
                                             tweet.source,
                                             tweet.text,
                                             tweet.user]
                                     }));
        };

        this.create_table = function(){
            var statement = ' create table tweets ( \
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
                    ) )';
            var http = new XMLHttpRequest();
            http.open("POST", crate_url + "_sql");
            http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            // TODO: Check if table already exists
            http.onreadystatechange = function() {console.log("Created Table");};
            http.send(JSON.stringify({stmt: statement}));

        };

        this.start = function() {
            this.create_table();
            this.tweets = 0;
            this.started = new Date().getTime();
            this.stop();
            this.oReq.previous_text = '';
            this.oReq.withCredentials = true;
            var self = this;
            this.oReq.onreadystatechange = function() {
                if (this.status == 401){
                    // If authorization fails redirect the user to the
                    // authentication endpoint
                    window.location = base_url + "/auth?origin="+host;
                    return;
                }
                var new_response = this.responseText.substring(this.previous_text.length);
                // Split the response. Each line contains a tweet in json format
                lines = new_response.split("\n");
                for (var i=0; i < lines.length - 1; i++) {
                    var tweet = JSON.parse( lines[i] );
                    self.store_tweet(tweet);
                    // update tweets per second
                    var twps = (1000 * self.tweets) / (new Date().getTime() - self.started);
                    $('#tweets').text('Tweets / s: ' + twps.toFixed(2));
                    this.previous_text += lines[i] + '\n';
                }
          };
          this.oReq.open("get", base_url + "/sample?origin="+host, true);
          this.oReq.send();
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
