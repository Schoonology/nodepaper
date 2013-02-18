var lib = require('../')
  , $$ = require('stepdown')
  , Article = lib('types/article')

function middleware(options) {
  var options = options || {}
    , type

  if (typeof options === 'function') {
    options = {
      type: options
    }
  }

  type = options.type || Article

  return function find(req, res, next) {
    var skip = req.query.skip || 0
      , limit = req.query.limit || 10

    $$([
      function ($) {
        type.getPublished({}, $.first())
      }
    ])
      .on('error', next)
      .on('complete', function (data) {
        res.send(data)
      })
  }
}

module.exports = middleware
