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
    .controller('Article', function ($scope, $route, Article) {
      $scope.doc = {
        type: Article,
        templateUrl: '/static/partials/article.html',
        name: $route.current.params.name,
        title: '',
        content: '',
        published: null
      }

      $scope.publish = function () {
        $scope.doc.published = Date.now()
      }

      if (!$scope.doc.name) {
        return
      }

      Article
        .load($route.current.params.name)
        .then(function (data) {
          $scope.doc.title = data.title
          $scope.doc.content = data.content
          $scope.doc.published = data.published
        })
    })
    .controller('ArticleNav', function ($scope, $rootScope, Article) {
      $scope.articles = []

      $scope.remove = function (name) {
        Article
          .remove(name)
          .then(function (data) {
            console.log('Removed:', data)
          })
        $scope.refresh()
      }

      $scope.refresh = $rootScope.refreshArticleNav = function () {
        Article
          .find()
          .then(function (list) {
            $scope.articles = list
          })
      }

      $scope.refresh()
    })
    .controller('Editor', function ($scope, $route, $rootScope, Page) {
      $scope.save = function () {
        var name = $scope.doc.name

        if (name !== $route.current.params.name) {
          console.log('Deleting:', $route.current.params.name)
          $scope.doc.type
            .remove($route.current.params.name)
            .then(function (data) {
              console.log('Deleted:', data)
              $rootScope.refreshPageNav()
            })
        }

        console.log('Saving:', name, $scope.doc)
        $scope.doc.type
          .save(name, $scope.doc)
          .then(function (data) {
            console.log('Saved:', data)
            $rootScope.refreshPageNav()
          })
      }
    })
    .controller('Index', function ($scope, Article) {
      $scope.articles = []

      Article.getPublished().then(function (data) {
        $scope.articles = data
        $scope.articles.forEach(function (article, index) {
          Article.load(article.name).then(function (data) {
            $scope.articles[index] = data
          })
        })
      })
    })
    .controller('Meta', function ($scope, Meta) {
      $scope.doc = {
        templateUrl: '/static/partials/meta.html',
        type: Meta
      }

      Meta
        .load()
        .then(function (data) {
          Object.keys(data).forEach(function (key) {
            $scope.doc[key] = data[key]
          })
        })

      $scope.save = function () {
        console.log('Saving:', $scope.doc)
        Meta
          .save($scope.doc)
          .then(function (data) {
            console.log('Saved:', data)
          })
      }
    })
})(this)
