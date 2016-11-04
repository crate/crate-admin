'use strict';

angular.module('feed', ['stats', 'udc'])
  .factory('QueryStringAppender', function(){
    return {
      append: function(url, k, v) {
        var qs = k + '=' + v;
        return url.indexOf('?') > -1 ? url + '&' + qs : url + '?' + qs;
      }
    };
  })
  .factory('FeedService', function($http, QueryStringAppender) {
    return {
      parse: function(url) {
        var fullUrl = QueryStringAppender.append(url, 'callback', 'JSON_CALLBACK');
        return $http.jsonp(fullUrl, {
          cache: false
        });
      }
    };
  })
  .factory('NotificationService', function($http){
    var readItems = null;
    var key = 'crate.readNotifications';
    return {
      readItems: function(){
        if (readItems === null) {
          var v = localStorage.getItem(key);
          readItems = v ? JSON.parse(v) : [];
        }
        return readItems;
      },
      markAsRead: function(id){
        var items = this.readItems();
        items.push(id);
        readItems = items;
        localStorage.setItem(key, JSON.stringify(items));
      }
    };
  })
  .controller('NotificationsController', function($scope, $sce, $http, $filter, $window,
    FeedService, QueryStringAppender, NotificationService, ClusterState, UdcSettings, UidLoader) {

    var MAX_ITEMS = 5;
    var CRATE_IO = 'https://crate.io'

    var doNotTrackURL= function(url) {
      return QueryStringAppender.append(url, 'udc.enabled', 'false');
    };

    $scope.blog_url = CRATE_IO + '/blog';
    $scope.demo_url = CRATE_IO + '/demo';
    $scope.version_url = CRATE_IO + '/versions.json';
    $scope.feed_url = CRATE_IO + '/feed/developernews.json';
    $scope.menu_url = CRATE_IO + '/feed/menu.json';

    UdcSettings.availability.success(function(data) {
      if (data.enabled !== true) {
        $scope.blog_url = doNotTrackUrl($scope.blog_url);
        $scope.demo_url = doNotTrackUrl($scope.demo_url);
        $scope.version_url = doNotTrackUrl($scope.version_url);
        $scope.feed_url = doNotTrackUrl($scope.feed_url);
        $scope.menu_url = doNotTrackUrl($scope.menu_url);
      }

      $scope.showUpdate = false;
      $scope.numUnread = 0;
      $scope.entries = [];

      var stableVersion;
      FeedService.parse($scope.version_url)
        .success(function(response) {
          if (response && response.crate) stableVersion = response.crate;
        });

      $scope.$watch(function(){ return ClusterState.data; }, function(data) {
        $scope.showUpdate = data.version && stableVersion && stableVersion > data.version.number;
        $scope.stableVersion = stableVersion;
        $scope.serverVersion = data.version ? data.version.number : '';
        $scope.noNotifications = (!$scope.showUpdate && $scope.entries.length === 0);
      }, true);

      $scope.noNotifications = true;

      FeedService.parse($scope.feed_url)
        .success(function(response) {
          if (response && response.length > 0) {
            var trunc = $filter('characters');
            var entries = response.splice(0, MAX_ITEMS);
            var unread = entries.length;
            entries.map(function(item, idx) {
              item.title = $sce.trustAsHtml(item.title);
              item.preview = $sce.trustAsHtml(trunc(item.excerpt, 150));
              item.timestamp = new Date(item.date);
              item.id = item.timestamp.getTime().toString(32);
              if ($scope.isRead(item)) unread--;
            });
            $scope.entries = entries;
            $scope.numUnread = unread;
          }
        })
        .error(function() {
          $scope.entries = [];
          $scope.numUnread = 0;
        });

      FeedService.parse($scope.menu_url)
        .success(function(response) {
          if (response && response.data) {
            $scope.menu = response.data;
          }
          UidLoader.load().success(function(uid) {
            if (uid !== null && data.enabled === true) {
              $scope.menu.map(function(item, idx) {
                item.url = QueryStringAppender.append(item.url, 'ajs_uid', uid.toString());
                item.url = QueryStringAppender.append(item.url, 'ajs_aid', uid.toString());
              });
            }
          });
        });
    });

    $scope.markAsRead = function markAsRead(item){
      if (item === 'all') {
        var all = $scope.entries;
        for (var i=0; i<all.length; i++) {
          NotificationService.markAsRead(all[i].id);
        }
        $scope.numUnread = 0;
      } else if (item) {
        NotificationService.markAsRead(item.id);
        $scope.numUnread = Math.max(0, $scope.numUnread-1);
      }
    };

    $scope.isRead = function isRead(item){
      var items = NotificationService.readItems();
      var id = item.id;
      for (var i=0; i<items.length; i++) {
        if (items[i] === id) return true;
      }
      return false;
    };

    $scope.goToUrl = function(url) {
      $window.open(url, "_blank");
    };

    $scope.goToPost = function(item) {
      $window.open(item.permalink + "?utm_source=adminui&utm_medium=browser&utm_term={" + item.tags.join('+') + "}&utm_content=blogpostlink&utm_campaign=newsfeed", "_news");
    };
    // Set default menu data
    $scope.menu = [{
        "url": "https://crate.io/demo?utm_source=adminui&utm_medium=browser&utm_term=&utm_content=demolink&utm_campaign=newsfeed&ajs_event=clicked_demo_link",
        "title": "Schedule a 1-ON-1 demo with a Crate engineer"
      }
    ];
  });