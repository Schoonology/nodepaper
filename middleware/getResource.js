var lib = require('../lib')
  , $$ = require('stepdown')
  , Resource = lib('resource')

function middleware(options) {
  var type

  if (typeof options === 'function') {
    options = {
      type: options
    }
  }

  type = options.type || Resource

  return function get(req, res, next) {
    $$([
      function ($) {
        type.load({
          name: req.params.name || null
        }, $.first())
      }
    ])
      .on('error', next)
      .on('complete', function (data) {
        if (!data) {
          data = 404
        }

        res.send(data)
      })
  }
}

module.exports = middleware
