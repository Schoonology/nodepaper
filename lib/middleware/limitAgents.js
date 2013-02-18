var lib = require('../')
  , rc = lib('rc')

function limitAgents(req, res, next) {
  var agent = req.get('X-Nodepaper-Agent')

  if (agent !== rc.requests.agentKey) {
    res.send(404)
  }

  next()
}

module.exports = limitAgents
