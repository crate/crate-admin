'use strict';

angular.module('tutorial', ['sql', 'translation'])
  .controller('TutorialController', function($scope, $window, SQLQuery, $sce, $translate, $translatePartialLoader, $rootScope, Translation) {

    var base_url = 'https://twitter.crate.io/api/v1';
    var loc = $window.location;
    var redirect = loc.protocol + '//' + loc.host + loc.pathname + loc.search;

    $scope.count = 0;
    $scope.importing = false;

    $scope.error = {};

    var Twitter = function() {

      var createStmt = 'create table if not exists tweets ( ' +
        '  id string primary key, ' +
        '  created_at timestamp, ' +
        '  text string INDEX using fulltext, ' +
        '  source string INDEX using fulltext, ' +
        '  retweeted boolean, ' +
        '  account_user object(strict) as ( ' +
        '    created_at timestamp, ' +
        '    verified boolean, ' +
        '    followers_count integer, ' +
        '    id string, ' +
        '    statuses_count integer, ' +
        '    description string INDEX using fulltext, ' +
        '    friends_count integer, ' +
        '    location string INDEX using fulltext ' +
        '  ) ' +
        ') with (number_of_replicas = \'0-all\')';
      var insertStmt = 'insert into tweets ' +
        '(created_at, id, retweeted, source, text, account_user) ' +
        'values ($1, $2, $3, $4, $5, $6)';

      this.storeTweet = function(tweet) {
        if (!tweet || !tweet.id) {
          return;
        }
        SQLQuery.execute(insertStmt, [
          tweet.created_at,
          tweet.id,
          tweet.retweeted,
          tweet.source,
          tweet.text,
          tweet.account_user], 
          false,
          false, 
          false);
      };

      this.createTable = function() {
        return SQLQuery.execute(createStmt, {}, false, false, true);
      };

      this.start = function() {
        if (this.request) {
          return; // already running!
        }
        this.count = 0;
        var self = this,
          currentResponseText='',
          tweets;
        var ctd = this.createTable();

        var fetch = function() {
          $scope.importing = true;

          // This is a long polling request.
          // We do not expect this to ever complete, except on timeout and just parse the
          // continously updating response for new tweets to insert.
          self.request = $.ajax(base_url + '/sample?origin=' + encodeURIComponent(redirect), {
            type: 'GET',
            xhrFields: {
              withCredentials: true
            },
            crossDomain: true,
            xhr: function() {
              var xhr = new window.XMLHttpRequest();
              xhr.addEventListener('progress', function(evt) {
                tweets = evt.target.responseText.substring(currentResponseText.length);
                tweets = tweets.split('\n');
                tweets = $.map(tweets, function (tweet) {
                  try {
                    return JSON.parse(tweet);
                  } catch (e) { return null; }
                });
                tweets = tweets.filter(function(tweet) {
                  return tweet !== null;
                });
                $.each(tweets, function (idx, tweet) {
                  self.storeTweet(tweet);
                });
                self.count += tweets.length;
                $scope.count = self.count;
                currentResponseText = evt.target.responseText;
              });
              return xhr;
            }
          })
            .fail(function (err) {
              // If this is an authorization failure, redirect to get
              // permission
              if (err.status === 401) {
                window.location = base_url + '/auth?origin=' + encodeURIComponent(redirect);
              }
            });
        };

        ctd.success(fetch);
        ctd.error(function(response){
          $scope.error = response.error;
        });
      };

      this.running = function() {
        return (this.request && this.request.state() === 'pending');
      };

      this.stop = function() {
        if (this.request) {
          this.request.abort();
        }
        this.request = null;
        $scope.importing = false;
      };
    };

    var twitter = new Twitter();
    // The authentication callback sets the start_twitter parameter after
    // a successfull login so the user doesn't have to click the button again
    if (localStorage.getItem('crate.start_twitter') === 'true') {
      localStorage.removeItem('crate.start_twitter');
      twitter.start();
    }

    $scope.startImport = function(){
      twitter.start();
    };

    $scope.stopImport = function(){
      twitter.stop();
    };

    $translatePartialLoader.addPart('./plugins/tutorial');
    $translate.refresh();


    // Update text if Language is Changed
    $rootScope.$on('$translateChangeSuccess', function() {
      $translate(['TUTORIAL.INSTRUCTION_1', 'TUTORIAL.TWEETS']).then(function(translations) {
        $scope.InstructionText1 = Translation.interpolate(translations['TUTORIAL.INSTRUCTION_1'], {
          tweets: '<b>' + translations['TUTORIAL.TWEETS'] + '</b>'
        });
        if (typeof $scope.InstructionText1 === 'string'){
          $scope.InstructionText1 = $sce.trustAsHtml($scope.InstructionText1);
        }
      });

      $translate(['TUTORIAL.INSTRUCTION_2', 'TUTORIAL.TABLES']).then(function(translations) {
        $scope.InstructionText2 = Translation.interpolate(translations['TUTORIAL.INSTRUCTION_2'],{
          tables: '<b>' + translations['TUTORIAL.TABLES'] + '</b>'
        });
        if (typeof $scope.InstructionText2 === 'string'){
          $scope.InstructionText2 = $sce.trustAsHtml($scope.InstructionText2);
        }
      });

      $translate(['TUTORIAL.INSTRUCTION_3', 'TUTORIAL.CONSOLE', 'TUTORIAL.QUERY']).then(function(translations) {
        $scope.InstructionText3 = Translation.interpolate(translations['TUTORIAL.INSTRUCTION_3'],{
          console: '<b>' + translations['TUTORIAL.CONSOLE'] + '</b>',
          query: '<code>SELECT text FROM tweets LIMIT 100</code>'
        });
        if (typeof $scope.InstructionText3 === 'string'){
          $scope.InstructionText3 = $sce.trustAsHtml($scope.InstructionText3);
        }
      });
    });

    $scope.$on('$destroy', function() {
      twitter.stop();
    });

  })
  .run(function($window, NavigationService, $translatePartialLoader, $filter, $rootScope, $translate) {

    $translatePartialLoader.addPart('./plugins/tutorial');
    $translate.refresh();
    var iconSrc = 'plugins/tutorial/static/icons/icon-getstarted.svg';
    var url = '/help';
    var position = 4;
    var re = /[\?|&]start_twitter=true/;

    NavigationService.addNavBarElement(iconSrc, $filter('translate', 'NAVIGATION.HELP'), url, position);

    if ($window.location.search.match(re) !== null) {
      var path = $window.location.pathname;
      localStorage.setItem('crate.start_twitter', 'true');
      $window.location.href = path + $window.location.search.replace(re, '') + '#' + url;
    }

    // Update Navbar Elements if Language Changes
    $rootScope.$on('$translateChangeSuccess', function() {
      $translate('NAVIGATION.HELP').then(function(translation) {
        NavigationService.updateNavBarElement(url, translation);
      });
    });
  });
