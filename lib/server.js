//
// # Server
//
// The Server is the top-most component of Nodepaper, responsible for delegating to all other components.
//
var http = require('http')
  , debug = require('debug')('nodepaper:server')
  , express = require('express')
  , nodefn = require('when/node/function')
  , when = require('when')
  , Config = require('./config')
  , ContentIndex = require('./contentindex')
  , Theme = require('./theme')

//
// ## Server `Server(obj)`
//
// Creates a new instance of Server.
//
function Server(obj) {
  if (!(this instanceof Server)) {
    return new Server(obj)
  }

  obj = obj || {}

  this._httpServer = null

  this._config = new Config()
  this._theme = null
  this._index = null
}
Server.createServer = Server

//
// ## start `start()`
//
// Returns a promise to be fulfilled when all internal dependencies are ready and `index` and `single` calls can be
// made.
//
Server.prototype.start = start
function start() {
  var self = this

  debug('Loading configuration...')

  return self
    ._config.load()
    .then(function () {
      debug('Configuration loaded. Starting other components...')

      self._theme = new Theme(self._config)
      self._index = new ContentIndex(self._config)
      self._initServer()

      return when
        .all([
          self._index.start(),
          self._theme.start()
        ])
    })
    .then(function () {
      debug('Listening...')
      return nodefn.call(function (port, callback) {
        self._httpServer.listen(port, callback)
      }, self._config.port)
    })
    .then(function () {
      debug('Started.')
      return self
    })
}

//
// ## index `index()`
//
// Returns a promise to be fulfilled with the index HTML contents.
//
Server.prototype.index = index
function index() {
  var self = this

  debug('Index, page: %s', 0) // TODO

  return self._index.posts(0, 3)
    .then(function (tuples) {
      return self._index.pages().then(function (pages) {
        return self._theme.render({
          index: true,
          error: null,
          pages: pages,
          posts: tuples
        })
      })
    })
}

//
// ## single `single(name)`
//
// Returns a promise to be fulfilled with the HTML for **name**.
//
Server.prototype.single = single
function single(name) {
  var self = this

  debug('Single: %s', name)

  return self._index.get(name)
    .then(function (tuple) {
      return self._index.pages().then(function (pages) {
        return self._theme.render({
          index: false,
          error: null,
          pages: pages,
          posts: tuple
        })
      })
    })
}

//
// ## error `error(err)`
//
// Returns a promise to be fulfilled with the error page for **err**, containing `code` and `message`.
//
Server.prototype.error = error
function error(err) {
  var self = this

  debug('Error: %d - %s', err.code, err.message)

  return self._index.pages().then(function (pages) {
    return self._theme.render({
      index: false,
      error: err,
      pages: pages,
      posts: []
    })
  })

  return self
}

//
// ## _initServer `_initServer()`
//
// Internal use only.
//
Server.prototype._initServer = _initServer
function _initServer() {
  var self = this
    , app = express()

  this._httpServer = http.createServer(app)

  function wrap(promise, res, next) {
    return promise
      .then(function (html) {
        res.send(html)
      }, function (err) {
        next(err)
      })
  }

  app.use('/theme', express.static(self._config.themedir))

  app.use('/favicon', function (req, res, next) {
    // TODO
    res.send(404)
  })

  app.get('/', function (req, res, next) {
    return wrap(self.index(), res, next)
  })

  app.get('/:name', function (req, res, next) {
    return wrap(self.single(req.params.name), res, next)
  })

  app.use(function (err, req, res, next) {
    debug('Error: %s', JSON.stringify(err))

    if (!err) {
      return
    }

    // No such file or directory
    if (err.code === 'ENOENT') {
      return wrap(self.error({
        code: 404,
        message: 'Not Found'
      }), res, next)
    }

    next(err)
  })

  app.use(express.errorHandler())
}

module.exports = Server
