'use strict';

angular.module('feed', ['stats'])
  .factory('FeedService', function($http){
    var PROXY_URL = 'https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num={num}&callback=JSON_CALLBACK&q={q}';
    return {
      parse: function(q, num) {
        var url = PROXY_URL.replace('{num}',String(num)).replace('{q}', encodeURIComponent(q));
        return $http.jsonp(url);
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
  .controller('NotificationsController', function ($scope, $sce, $http, FeedService, NotificationService, ClusterState) {
    var FEED_URL = 'https://crate.io/blog/category/developernews/feed';
    var MAX_ITEMS = 5;
    var VERSION_URL = 'https://crate.io/versions.json';
    var stableVersion;

    $scope.showUpdate = false;
    $scope.numUnread = 0;
    $scope.feed = {
      entries: []
    };

    var markAsRead = function markAsRead(item){
      if (item === 'all') {
        var all = $scope.feed.entries;
        for (var i=0; i<all.length; i++) {
          NotificationService.markAsRead(all[i].id);
        }
        $scope.numUnread = 0;
      } else if (item) {
        NotificationService.markAsRead(item.id);
        $scope.numUnread = Math.max(0, $scope.numUnread-1);
      }
    };

    var isRead = function isRead(item){
      var items = NotificationService.readItems();
      var id = item.id;
      for (var i=0; i<items.length; i++) {
        if (items[i] === id) return true;
      }
      return false;
    };

    $http.get(VERSION_URL).success(function(response){
      if (response && response.crate) stableVersion = response.crate;
    });

    FeedService.parse(FEED_URL, MAX_ITEMS).then(function(response){
      var result = response.data;
      if (result.responseData && result.responseStatus === 200) {
        var feed = result.responseData.feed;
        var entries = feed.entries;
        var unread = entries.length;
        entries.map(function(item, idx){
          item.preview = $sce.trustAsHtml(item.contentSnippet);
          item.timestamp = new Date(item.publishedDate);
          item.id = item.timestamp.getTime().toString(32);
          if (isRead(item)) unread--;
        });
        $scope.feed = feed;
        $scope.numUnread = unread;
      } else {
        console.warn(result);
      }
    });

    $scope.$watch(function(){ return ClusterState.data; }, function(data) {
      $scope.showUpdate = data.version && stableVersion && stableVersion > data.version.number;
      $scope.noNotifications = (!$scope.showUpdate && $scope.feed.entries.length === 0);
    }, true);

    $scope.noNotifications = true;
    $scope.isRead = isRead;
    $scope.markAsRead = markAsRead;

  });
