var lib = require('../lib')
  , crypto = require('crypto')
  , $$ = require('stepdown')
  , rc = lib('rc')

function generateMD5(data) {
  return crypto.createHash('md5').update(String(data)).digest('hex')
}

function validateSecret(req, res, next) {
  var key = req.get('X-Nodepaper-Key')
    , signature = req.get('X-Nodepaper-Signature')
    , timestamp = req.get('X-Nodepaper-Timestamp') || 0
    , nonce = req.get('X-Nodepaper-Nonce')
    , secret = rc.keys[key]
    , now = Date.now()

  if (!secret) {
    console.error('Invalid key:', key)
    res.send(401)
    return
  }

  if (timestamp < now - rc.requests.window || timestamp > now + rc.requests.window) {
    console.error('Invalid timestamp:', timestamp)
    res.send(400)
    return
  }

  if (generateMD5(secret + nonce) !== signature) {
    console.error('Invalid signature:', signature)
    res.send(403)
    return
  }

  next()
}

module.exports = validateSecret
