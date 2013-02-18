var lib = require('./')
  , path = require('path')
  , express = require('express')
  , rc = lib('rc')
  , rootDir = path.resolve(__dirname, '..')

function getThemeDir(settings, file) {
  if (file) {
    return path.resolve(rootDir, rc.paths.themes, settings.theme, file)
  } else {
    return path.resolve(rootDir, rc.paths.themes, settings.theme)
  }
}

function wrap(settings, middleware) {
  var lastTheme = null
    , fn = null

  return function wrapped(req, res, next) {
    var currentTheme = getThemeDir(settings)

    if (lastTheme !== currentTheme) {
      fn = middleware(currentTheme)
      lastTheme = currentTheme
    }

    return fn(req, res, next)
  }
}

function editor(root) {
  return function (req, res, next) {
    res.sendfile(path.resolve(root, 'editor.html'))
  }
}

function index(root) {
  return function (req, res, next) {
    res.sendfile(path.resolve(root, 'index.html'))
  }
}

//
// ## configure(settings)
//
// Creates a new Express middleware stack based on the values in **settings**.
//
function configure(settings) {
  var app = express()

  //
  // ## Middleware
  //
  app
    // TODO: Fallback to a basic favicon.
    .use(express.favicon(getThemeDir(settings, 'favicon.ico')))

    .use(express.logger())
    .use(express.cookieParser())
    .use(express.bodyParser())
    .use(express.query())

    .use(app.router)

    // TODO: Cache.
    .use('/static', express.static(path.resolve(__dirname, '..', rc.paths.static)))
    .use('/theme', wrap(settings, express.static))
    .use('/editor', editor(path.resolve(__dirname, '..', rc.paths.static)))
    .use('/', wrap(settings, index))

    .use(express.errorHandler())

  //
  // ## Routes
  //
  app.put('/api/*', lib('middleware/validateSecret'))
  app.del('/api/*', lib('middleware/validateSecret'))
  app.all('/api/*', lib('middleware/limitAgents'))
  app.all('/api/ping', lib('middleware/ping'))

  app.get('/api/articles', lib('middleware/findResource')(lib('types/article')))
  app.get('/api/articles/published', express.query(), lib('middleware/getArticles')())
  app.get('/api/articles/:name', lib('middleware/getResource')(lib('types/article')))
  app.put('/api/articles/:name', lib('middleware/putResource')(lib('types/article')))
  app.del('/api/articles/:name', lib('middleware/delResource')(lib('types/article')))

  app.get('/api/pages', lib('middleware/findResource')(lib('types/page')))
  app.get('/api/pages/:name', lib('middleware/getResource')(lib('types/page')))
  app.put('/api/pages/:name', lib('middleware/putResource')(lib('types/page')))
  app.del('/api/pages/:name', lib('middleware/delResource')(lib('types/page')))

  app.get('/api/settings', lib('middleware/getResource')(lib('types/settings')))
  app.put('/api/settings', lib('middleware/putResource')(lib('types/settings')))

  return app
}

module.exports = {
  configure: configure
}
