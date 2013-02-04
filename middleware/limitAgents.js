var lib = require('../lib')
  , $$ = require('stepdown')
  , rc = lib('rc')

function limitAgents(req, res, next) {
  var agent = req.get('X-Nodepaper-Agent')

  if (agent !== rc.agentKey) {
    res.send(410)
  }

  next()
}

module.exports = limitAgents
