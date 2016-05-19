'use strict';

angular.module('feed', ['stats', 'udc'])
  .factory('FeedService', function($http){
    return {
      parse: function(feed) {
        return $http.jsonp(feed, {cache: false});
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
  .controller('NotificationsController', function ($scope, $sce, $http, $filter, FeedService, NotificationService, ClusterState, UdcSettings, UidLoader) {
    var appendQueryString = function(base, qs){
        return base.indexOf('?') > -1 ? base + '&' + qs : base + '?' + qs;
    };

    var MAX_ITEMS = 5;
    var CRATE_IO = 'https://crate.io'
    var DISABLE_UDC = 'udc.enabled=false';

    $scope.blog_url = CRATE_IO + '/blog';
    $scope.demo_url = CRATE_IO + '/demo';
    $scope.version_url = CRATE_IO + '/versions.json';
    $scope.feed_url = CRATE_IO + '/feed/developernews.json';
    $scope.menu_url = CRATE_IO + '/feed/menu.json';

    UdcSettings.availability.success(function(data) {
      if (data.enabled !== true) {
        $scope.blog_url = appendQueryString($scope.blog_url, DISABLE_UDC);
        $scope.demo_url = appendQueryString($scope.demo_url, DISABLE_UDC);
        $scope.version_url = appendQueryString($scope.version_url, DISABLE_UDC);
        $scope.feed_url = appendQueryString($scope.feed_url, DISABLE_UDC);
        $scope.menu_url = appendQueryString($scope.menu_url, DISABLE_UDC);
      }

      $scope.showUpdate = false;
      $scope.numUnread = 0;
      $scope.entries = [];

      var stableVersion;
      $http.get($scope.version_url, { withCredentials: true }).success(function(response){
        if (response && response.crate) stableVersion = response.crate;
      });

      $scope.$watch(function(){ return ClusterState.data; }, function(data) {
        $scope.showUpdate = data.version && stableVersion && stableVersion > data.version.number;
        $scope.stableVersion = stableVersion;
        $scope.serverVersion = data.version ? data.version.number : '';
        $scope.noNotifications = (!$scope.showUpdate && $scope.entries.length === 0);
      }, true);

      $scope.noNotifications = true;

      FeedService.parse($scope.feed_url).then(function(result){
        var trunc = $filter('characters');
        if (result.status === 200 && result.data.length > 0) {
          var entries = result.data.splice(0, MAX_ITEMS);
          var unread = entries.length;
          entries.map(function(item, idx){
            item.title = $sce.trustAsHtml(item.title);
            item.preview = $sce.trustAsHtml(trunc(item.excerpt, 150));
            item.timestamp = new Date(item.date);
            item.id = item.timestamp.getTime().toString(32);
            if (isRead(item)) unread--;
          });
          $scope.entries = entries;
          $scope.numUnread = unread;
        }
      });

      $http.get(appendQueryString($scope.menu_url, 'callback=JSON_CALLBACK')).success(function(response){
        if (response && response.data) {
            $scope.menu = response.data;
        }
        UidLoader.load().success(function(uid){
          if (uid !== null && data.enabled === true) {
            $scope.menu.map(function(item, idx) {
              item.url = appendQueryString(item.url, 'ajs_uid=' + uid.toString());
              item.url = appendQueryString(item.url, 'ajs_aid=' + uid.toString());
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

    // Set default menu data
    $scope.menu = [
        {"url": "https://crate.io/demo?utm_source=adminui&utm_medium=browser&utm_term=&utm_content=demolink&utm_campaign=newsfeed&ajs_event=clicked_demo_link",
         "title": "Schedule a 1-ON-1 demo with a Crate engineer"},
        {"url": "https://crate.io/blog?utm_source=adminui&utm_medium=browser&utm_term=&utm_content=morelink&utm_campaign=newsfeed&ajs_event=clicked_more_link",
         "title": "More"}
    ];

  });
