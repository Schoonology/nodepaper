var Server = require('./lib/server')

if (require.main === module) {
  require('./bin/nodepaper')
} else {
  module.exports = {
    Server: Server,
    createServer: Server.createServer
  }
}
