'use strict';

import '../services/stats';
import '../services/utils';

const feed = angular.module('feed', ['stats', 'utils'])
  .factory('QueryStringAppender', function() {
    return {
      append: function(url, k, v) {
        var qs = k + '=' + v;
        return url.indexOf('?') > -1 ? url + '&' + qs : url + '?' + qs;
      }
    };
  })
  .factory('FeedService', function ($http, QueryStringAppender, $sce) {
    return {
      parse: function (url) {
        var params = {
          format: 'json',
          output: 'basic'
        };

        return $http.jsonp($sce.trustAsResourceUrl(url), {
          params: params,
          cache: false
        });
      }
    };
  })
  .factory('NotificationService', function() {
    var readItems = null;
    var key = 'crate.readNotifications';
    return {
      readItems: function () {
        if (readItems === null) {
          var v = localStorage.getItem(key);
          readItems = v ? JSON.parse(v) : [];
        }
        return readItems;
      },
      markAsRead: function(id) {
        var items = this.readItems();
        items.push(id);
        readItems = items;
        localStorage.setItem(key, JSON.stringify(items));
      }
    };
  })
  .controller('NotificationsController', function($scope, $sce, $http, $filter, $window,
    FeedService, QueryStringAppender, NotificationService) {

    $scope.numUnread = 0;
    $scope.entries = [];

    $scope.markAsRead = function(item) {
      if (item === 'all') {
        var all = $scope.entries;
        for (var i = 0; i < all.length; i++) {
          NotificationService.markAsRead(all[i].id);
        }
        $scope.numUnread = 0;
      } else if (item) {
        NotificationService.markAsRead(item.id);
        $scope.numUnread = Math.max(0, $scope.numUnread - 1);
      }
    };

    $scope.goToUrl = function(url) {
      $window.open(url, '_blank');
    };

    // Set default menu data
    $scope.menu = [
      {
        'url': 'https://cratedb.com/demo?utm_source=adminui&utm_medium=browser&utm_term=&utm_content=demolink&utm_campaign=newsfeed&ajs_event=clicked_demo_link',
        'title': 'Schedule a 1-ON-1 demo with a Crate engineer'
      },
      {
        'url': 'https://cratedb.com/blog/',
        'title': 'CrateDB blog'
      }
    ];
  });

export default feed;
