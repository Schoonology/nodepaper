/*global angular, hex_md5 */
;(function (global) {
  function Resource($http) {
    function request(method, url, data) {
      var headers = {}
        , timestamp
        , nonce
        , signature

      if (method.toLowerCase() === 'put' || method.toLowerCase() === 'delete') {
        timestamp = Date.now()
        nonce = Math.random().toString().slice(2) + timestamp
        signature = hex_md5('removeme' + nonce)

        headers = {
          'X-Nodepaper-Key': 'test',
          'X-Nodepaper-Timestamp': timestamp,
          'X-Nodepaper-Signature': signature,
          'X-Nodepaper-Nonce': nonce
        }
      }

      headers['X-Nodepaper-Agent'] = 'Nodepaper'

      return $http({
        method: method,
        url: url,
        params: null,
        data: data || {},
        headers: headers,
        cache: false,
        timeout: 1000
      })
    }

    function getApiPath(path) {
      return '/api' + path
    }

    return {
      save: function save(path, body) {
        return request('PUT', getApiPath(path), body).then(function (result) {
          // TODO
          return result.data
        })
      },
      load: function load(path) {
        return request('GET', getApiPath(path)).then(function (result) {
          // TODO
          return result.data
        })
      },
      remove: function remove(path) {
        return request('DELETE', getApiPath(path)).then(function (result) {
          // TODO
          return result.data
        })
      },
      find: function find(path) {
        return request('GET', getApiPath(path)).then(function (result) {
          // TODO
          return result.data
        })
      }
    }
  }

  function Article(Resource) {
    var controller = {}
      , root = '/articles'

    controller.save = save
    function save(name, body) {
      return Resource.save(root + '/' + name, body)
    }

    controller.load = load
    function load(name) {
      return Resource.load(root + '/' + name)
    }

    controller.remove = remove
    function remove(name) {
      return Resource.remove(root + '/' + name)
    }

    controller.find = find
    function find() {
      return Resource.find(root)
    }

    return controller
  }

  function Author(Resource) {
    var controller = {}
      , root = '/authors'

    controller.save = save
    function save(name, body) {
      return Resource.save(root + '/' + name, body)
    }

    controller.load = load
    function load(name) {
      return Resource.load(root + '/' + name)
    }

    controller.remove = remove
    function remove(name) {
      return Resource.remove(root + '/' + name)
    }

    controller.find = find
    function find() {
      return Resource.find(root)
    }

    return controller
  }

  function Page(Resource) {
    var controller = {}
      , root = '/pages'

    controller.save = save
    function save(name, body) {
      return Resource.save(root + '/' + name, body)
    }

    controller.load = load
    function load(name) {
      return Resource.load(root + '/' + name)
    }

    controller.remove = remove
    function remove(name) {
      return Resource.remove(root + '/' + name)
    }

    controller.find = find
    function find() {
      return Resource.find(root)
    }

    return controller
  }

  angular
    .module('nodepaper.services', [])
    .factory('Resource', Resource)
    .factory('Article', Article)
    .factory('Author', Author)
    .factory('Page', Page)
})(this)
