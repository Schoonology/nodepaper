/*global angular */
/*jshint browser:true */
(function (global) {
  angular
    .module('nodepaper.directives', [])
    .directive('npActive', function ($location, $timeout) {
      return {
        restrict: 'A',
        link: function ($scope, $el, attrs) {
          // TODO: Find a better way than $timeout.
          $timeout(function () {
            if (!$el.hasClass('nav-list')) {
              console.error('The np-active directive expects a ul.nav-list.')
            }

            $scope.$watch(function (scope) {
              return $location.path()
            }, function (value) {
              $el.find('a').each(function (key, a) {
                var $a = angular.element(a)

                if (a.hash === '#' + value) {
                  $a.parent().addClass('active')
                } else {
                  $a.parent().removeClass('active')
                }
              })
            })
          }, 10)
        }
      }
    })
})(window)
