'use strict';

angular.module('feed', ['stats'])
  .factory('FeedService', function($http){
    return {
      fetch: function() {
        return $http.get('https://crate.io/feed/news.json', {cache: false});
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
  .controller('NotificationsController', function ($scope, $sce, $http, $filter, FeedService, NotificationService, ClusterState) {
    var BLOG_URL = 'https://crate.io/blog/';
    var MAX_ITEMS = 5;
    var VERSION_URL = 'https://crate.io/versions.json';
    var stableVersion;

    var trunc = $filter('characters');
    var date = $filter('date');

    $scope.showUpdate = false;
    $scope.numUnread = 0;
    $scope.entries = [];
    $scope.blog_url = BLOG_URL;

    var markAsRead = function markAsRead(item){
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

    var isRead = function isRead(item){
      var items = NotificationService.readItems();
      var id = item.id;
      for (var i=0; i<items.length; i++) {
        if (items[i] === id) return true;
      }
      return false;
    };

    $http.get(VERSION_URL, { withCredentials: true }).success(function(response){
      if (response && response.crate) stableVersion = response.crate;
    });

    FeedService.fetch().then(function(result){
      if (result.status === 200 && result.data.length > 0) {
        var entries = result.data.splice(0, MAX_ITEMS);
        var unread = entries.length;
        entries.map(function(item, idx){
          item.title = $sce.trustAsHtml(item.title);
          item.preview = $sce.trustAsHtml(trunc(item.excerpt, 150));
          item.timestamp = date(item.date, 'yyyy-MM-dd HH:ss');
          if (isRead(item)) unread--;
        });
        $scope.entries = entries;
        $scope.numUnread = unread;
      }
    });

    $scope.$watch(function(){ return ClusterState.data; }, function(data) {
      $scope.showUpdate = data.version && stableVersion && stableVersion > data.version.number;
      $scope.stableVersion = stableVersion;
      $scope.serverVersion = data.version ? data.version.number : '';
      $scope.noNotifications = (!$scope.showUpdate && $scope.entries.length === 0);
    }, true);

    $scope.noNotifications = true;
    $scope.isRead = isRead;
    $scope.markAsRead = markAsRead;

  });
