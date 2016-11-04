describe('NavigationService', function() {
  'use strict';

  var mockNavigationService;

  beforeEach(module('common'));
  beforeEach(module('crate'));
  beforeEach(function() {
    angular.mock.inject(function($injector) {
      mockNavigationService = $injector.get('NavigationService');
    });
  });

  describe('mockNavigationService', function() {

    it('should add navBarElement in specified position', inject(function() {
      var navBarElement = {
        image: "example.icon",
        url: "/test",
        text: "example",
        index: 1
      };
      mockNavigationService.addNavBarElement(navBarElement.image, navBarElement.text, navBarElement.url, navBarElement.index);


      var navBarElements = mockNavigationService.navBarElements;
      console.log(navBarElements);
      expect(navBarElements[1]).toEqual({
        text: 'example',
        iconSrc: 'example.icon',
        urlPattern: '/test'
      });

    }));

    it('should update navBarElement text', inject(function() {
      //insert element in navBarElements
      var navBarElement = {
        image: "example.icon",
        url: "/test",
        text: "example",
        index: 1
      };
      mockNavigationService.addNavBarElement(navBarElement.image, navBarElement.text, navBarElement.url, navBarElement.index);

      //verify successful insert
      var navBarElements = mockNavigationService.navBarElements;
      expect(navBarElements[1]).toEqual({
        text: 'example',
        iconSrc: 'example.icon',
        urlPattern: '/test'
      });

      mockNavigationService.updateNavBarElement(navBarElement.url, 'updated');

      //verify element is updated
      navBarElements = mockNavigationService.navBarElements;
      expect(navBarElements[1].text).toEqual('updated');

    }));

  });

});