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
    .use('/theme', express.static(getThemeDir(settings)))
    .use('/editor', function (req, res, next) {
      res.sendfile(path.resolve(__dirname, '..', rc.paths.static, 'editor', 'index.html'))
    })
    .use('/', function (req, res, next) {
      res.sendfile(path.resolve(__dirname, '..', rc.paths.static, 'index.html'))
    })

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
