/*global angular, hex_md5 */
;(function (global) {
  var API_ROOT = '/api'

  function npHttp($http) {
    //
    // Public API
    //
    return {
      request: request,
      get: get,
      put: put,
      del: del
    }

    //
    // Function definitions
    //
    function request(method, url, data) {
      var headers = {}
        , timestamp
        , nonce
        , signature

      // TODO: Configure key & secret or pull from UI.
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

    function get(path) {
      return request('GET', API_ROOT + path)
    }

    function put(path, body) {
      return request('PUT', API_ROOT + path, body)
    }

    function del(path) {
      return request('DELETE', API_ROOT + path)
    }
  }

  function npResource(root) {
    return function (npHttp) {
      //
      // Public API
      //
      return {
        load: load,
        save: save,
        remove: remove,
        find: find,
        getPublished: getPublished
      }

      //
      // Function definitions
      //
      function pluckData(result) {
        return result.data
      }

      function save(name, body) {
        return npHttp.put(root + '/' + name, body).then(pluckData)
      }

      function load(name) {
        return npHttp.get(root + '/' + name).then(pluckData)
      }

      function remove(name) {
        return npHttp.del(root + '/' + name).then(pluckData)
      }

      function find() {
        return npHttp.get(root).then(pluckData)
      }

      function getPublished() {
        return npHttp.get(root + '/published').then(pluckData)
      }
    }
  }

  function Meta(npHttp) {
    //
    // Public API
    //
    return {
      load: load,
      save: save
    }

    //
    // Function definitions
    //
    function pluckData(result) {
      return result.data
    }

    function save(body) {
      return npHttp.put('/meta', body).then(pluckData)
    }

    function load() {
      return npHttp.get('/meta').then(pluckData)
    }
  }

  angular
    .module('nodepaper.services', [])
    .factory('npHttp', npHttp)
    .factory('Article', npResource('/articles'))
    .factory('Page', npResource('/pages'))
    .factory('Meta', Meta)
})(this)
