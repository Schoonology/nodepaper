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
    .then(function validate(data) {
      var reqsMet = true

      debug('Loaded configuration: %s', JSON.stringify(data, null, 2))

      REQUIRED_FIELDS.forEach(function (field) {
        if (!data[field]) {
          console.error('Missing required field:', field)
          reqsMet = false
        }
      })

      if (!reqsMet) {
        return when.reject(new Error('Missing required fields'))
      }

      return data
    })
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
    .then(function copy(data) {
      Object.keys(data).forEach(function (key) {
        self[key] = data[key]
      })
      return self
    })
}

module.exports = Config
