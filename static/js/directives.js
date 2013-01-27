/*global angular */
;(function (global) {
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

            function setActive(value) {
              $el.find('a').each(function (key, a) {
                var $a = angular.element(a)

                if ('/' + $a.attr('ng-href') === value) {
                  $a.parent().addClass('active')
                } else {
                  $a.parent().removeClass('active')
                }
              })
            }

            $scope.$watch(function (scope) {
              return $location.path()
            }, function (value) {
              setActive(value)
            })

            setActive($location.path())
          }, 100)
        }
      }
    })
    .directive('npTabView', function () {
      return {
        restrict: 'A',
        compile: function () {
          return {
            pre: function ($scope, $el, attrs) {
              $scope.currentMode = null
            },
            post: function ($scope, $el, attrs) {
              $scope.$watch('currentMode', function (newValue, oldValue) {
                $el.find('*[np-tab-pane=' + oldValue + ']').hide()
                $el.find('*[np-tab-pane=' + newValue + ']').show()
              })

              $scope.$watch('currentMode', function (newValue, oldValue) {
                $el.find('*[np-tab=' + oldValue + ']').removeClass('active')
                $el.find('*[np-tab=' + newValue + ']').addClass('active')
              })
            }
          }
        }
      }
    })
    .directive('npTab', function () {
      return {
        restrict: 'A',
        link: function ($scope, $el, attrs) {
          if (!attrs.npTab) {
            console.error('npTab requires a name.')
            return
          }

          if (!$scope.currentMode) {
            $scope.currentMode = attrs.npTab
          }

          // Disable the default Bootstrap binding, which will break Angular routing.
          $el.find('a').attr('href', '')

          $el.find('a').click(function (event) {
            if ($scope.currentMode === attrs.npTab) {
              return
            }

            $scope.currentMode = attrs.npTab
            $scope.$apply()
          })
        }
      }
    })
    .directive('npTabPane', function () {
      return {
        restrict: 'A',
        link: function ($scope, $el, attrs) {
          if (!attrs.npTabPane) {
            console.error('npTabPane requires a name.')
            return
          }

          if ($scope.currentMode !== attrs.npTabPane) {
            $el.hide()
          }
        }
      }
    })
    .directive('npRenderTemplate', function ($compile) {
      return {
        restrict: 'A',
        link: function ($scope, $el, attrs) {
          $scope.$watch(
            function (scope) {
              return $scope.$eval(attrs.template)
            },
            function (value) {
              $el.html(value)

              $compile($el.contents())($scope)
            }
          )
        }
      }
    })
})(this)
