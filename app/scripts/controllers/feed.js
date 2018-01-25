'use strict';

import '../services/stats';
import '../services/udc';
import '../services/utils';

const feed = angular.module('feed', ['stats', 'udc', 'utils'])
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
    FeedService, QueryStringAppender, NotificationService, ClusterState, UdcSettings, UidLoader) {

    var CRATE_IO = 'https://crate.io';

    var doNotTrackUrl = function(url) {
      return QueryStringAppender.append(url, 'udc.enabled', 'false');
    };

    $scope.blog_url = CRATE_IO + '/blog';
    $scope.demo_url = CRATE_IO + '/demo';
    $scope.version_url = CRATE_IO + '/versions.json';
    $scope.menu_url = CRATE_IO + '/feed/menu.json';

    UdcSettings.availability.then(function(data) {
      if (data.enabled !== true) {
        $scope.blog_url = doNotTrackUrl($scope.blog_url);
        $scope.demo_url = doNotTrackUrl($scope.demo_url);
        $scope.version_url = doNotTrackUrl($scope.version_url);
        $scope.feed_url = doNotTrackUrl($scope.feed_url);
        $scope.menu_url = doNotTrackUrl($scope.menu_url);
      }

      $scope.numUnread = 0;
      $scope.entries = [];

      var stableVersion;
      FeedService.parse($scope.version_url)
        .then(function(response) {
          if (response && response.crate) {
            stableVersion = response.crate;
          }
        });

      $scope.$watch(function() {
        return ClusterState.data;
      }, function(data) {
        $scope.showUpdate = data.version && stableVersion && stableVersion > data.version.number;
        $scope.stableVersion = stableVersion;
        $scope.serverVersion = data.version ? data.version.number : '';
      }, true);

      $scope.showUpdate = false;
      
      FeedService.parse($scope.menu_url)
        .then(function(response) {
          if (response && response.data) {
            $scope.menu = response.data.data;
          }
          UidLoader.load().then(function(uid) {
            if (uid !== null && data.enabled === true) {
              $scope.menu.map(function(item) {
                item.url = QueryStringAppender.append(item.url, 'ajs_uid', uid.toString());
                item.url = QueryStringAppender.append(item.url, 'ajs_aid', uid.toString());
              });
            }
          });
        });
    });

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
    $scope.menu = [{
      'url': 'https://crate.io/demo?utm_source=adminui&utm_medium=browser&utm_term=&utm_content=demolink&utm_campaign=newsfeed&ajs_event=clicked_demo_link',
      'title': 'Schedule a 1-ON-1 demo with a Crate.io engineer'
    }];
  });

export default feed;
