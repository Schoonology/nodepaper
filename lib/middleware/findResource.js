var lib = require('../')
  , $$ = require('stepdown')
  , Resource = lib('types/resource')

function middleware(options) {
  var type

  if (typeof options === 'function') {
    options = {
      type: options
    }
  }

  type = options.type || Resource

  return function find(req, res, next) {
    $$([
      function ($) {
        type.find({}, $.first())
      }
    ])
      .on('error', next)
      .on('complete', function (data) {
        res.send(data)
      })
  }
}

module.exports = middleware