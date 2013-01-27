/*global angular, CodeMirror */
;(function (global) {
  function toString(value) {
    if (angular.isUndefined(value) || value === null) {
      return ''
    } else if (angular.isObject(value) || angular.isArray(value)) {
      return JSON.stringify(value, null, 2)
    }

    return String(value)
  }

  angular
    .module('codemirror', [])
    .directive('codemirror', function ($timeout) {
      return {
        restrict: 'E',
        require: 'ngModel',
        replace: true,
        template: '<textarea></textarea>',
        link: function (scope, $el, attrs, ngModel) {
          var mode = attrs.mode
            , theme = attrs.theme
            , json = false

          if (mode === 'json') {
            mode = 'javascript'
            json = true
          }

          $timeout(function () {
            var mirror = CodeMirror.fromTextArea($el[0], {
              mode: mode || 'javascript',
              theme: theme || 'monokai',
              json: json,
              autoCloseTags: true
            })

            mirror.on('change', function () {
              var value = mirror.getValue()

              if (value !== ngModel.$viewValue && !scope.$$phase) {
                scope.$apply(function() {
                  if (json) {
                    try {
                      value = JSON.parse(value)
                    } catch (e) {
                    }
                  }

                  ngModel.$setViewValue(value)
                })
              }
            })

            ngModel.$formatters.push(toString)

            ngModel.$render = function () {
              mirror.setValue(ngModel.$viewValue)
            }

            // TODO: Standardize this somewhere. Add another directive to the tab view that emits events
            // to child directives like this one.
            $el.parents('*[np-tab-view]').find('li[np-tab] a').click(function () {
              $timeout(function () {
                mirror.refresh()
              })
            })
          })
        }
      }
    })
})(this)
