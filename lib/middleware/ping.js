var $$ = require('stepdown')

function ping(req, res, next) {
  $$([
    function ($) {
      res.send('pong')
    }
  ]).on('error', next)
}

module.exports = ping
