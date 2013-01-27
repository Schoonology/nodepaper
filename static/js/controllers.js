/*global angular */
;(function (global) {
  angular
    .module('nodepaper.controllers', ['nodepaper.services'])
    .controller('Page', function ($scope, $route, Page) {
      $scope.doc = {
        templateUrl: '/static/partials/page.html',
        name: $route.current.params.name,
        meta: {},
        content: '',
        type: Page
      }

      if (!$scope.doc.name) {
        return
      }

      Page
        .load($route.current.params.name)
        .then(function (data) {
          $scope.doc.content = data.content
          $scope.doc.meta = data.meta
        })
    })
    .controller('PageNav', function ($scope, $rootScope, Page) {
      $scope.pages = []

      $scope.remove = function (name) {
        Page
          .remove(name)
          .then(function (data) {
            console.log('Removed:', data)
          })
        $scope.refresh()
      }

      $scope.refresh = $rootScope.refreshPageNav = function () {
        Page
          .find()
          .then(function (list) {
            $scope.pages = list
          })
      }

      $scope.refresh()
    })
    .controller('Editor', function ($scope, $route, $rootScope, Page) {
      $scope.save = function () {
        var name = $scope.doc.name
          , body = {
              meta: $scope.doc.meta,
              content: $scope.doc.content
            }

        console.log('Saving:', name, body)

        $scope.doc.type
          .save(name, body)
          .then(function (data) {
            console.log('Saved:', data)
            // TODO
            $rootScope.refreshPageNav()
          })
      }
    })
})(this)
