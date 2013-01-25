var path = require('path')
  , rc = require('rc')('nodepaper', require('localrc')('nodepaper', {}))

Object.keys(rc.paths).forEach(function (key) {
  var _path = rc.paths[key]

  if (_path.charAt(0) !== '/') {
    _path = path.resolve(__dirname, '..', rc.paths[key])
  }

  rc.paths[key] = _path
})

module.exports = rc
