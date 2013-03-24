//
// # Config
//
// Responsible for loading, validating, and preprocessing configuration data.
//
var path = require('path')
  , debug = require('debug')('nodepaper:config')
  , rc = require('rc')('nodepaper', require('../config'))
  , when = require('when')
  , REQUIRED_FIELDS = ['port', 'postdir', 'themedir']
  , PATHS = ['postdir', 'themedir']

//
// ## Config `Config(obj)`
//
// Creates a new instance of Config with the following options:
//
function Config(obj) {
  if (!(this instanceof Config)) {
    return new Config(obj)
  }

  obj = obj || {}

  this.data = null
  this._loadObj(obj)
}
Config.createConfig = Config

//
// ## load `load()`
//
// Returns a promise to be fulfilled with the complete, valid, preprocessed configuration data.
//
Config.prototype.load = load
function load() {
  var self = this

  return when(rc)
    .then(function preprocess(data) {
      // Paas support
      if (process.env.PORT) {
        data.port = process.env.PORT
      }

      // Absolute paths
      PATHS.forEach(function (field) {
        if (data[field]) {
          data[field] = path.resolve(process.cwd(), data[field])
        }
      })

      return data
    })
    .then(function validate(data) {
      var reqsMet = true

      self._loadObj(data)
      debug('Final configuration: %s', JSON.stringify(self, null, 2))

      REQUIRED_FIELDS.forEach(function (field) {
        if (!self[field]) {
          console.error('Missing required field:', field)
          reqsMet = false
        }
      })

      if (!reqsMet) {
        return when.reject(new Error('Missing required fields'))
      }

      return self
    })
}

//
// ## _loadObj `_loadObj(obj)`
//
// Internal use only.
//
// Synchronously loads all fields from **obj**.
//
Config.prototype._loadObj = _loadObj
function _loadObj(obj) {
  var self = this

  if (!obj) {
    return self
  }

  Object.keys(obj).forEach(function (key) {
    self[key] = obj[key]
  })

  return self
}

module.exports = Config
