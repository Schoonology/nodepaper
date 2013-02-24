var lib = require('./')
  , fs = require('fs')
  , http = require('http')
  , path = require('path')
  , $$ = require('stepdown')
  , consolidate = require('consolidate')
  , express = require('express')
  , rc = lib('rc')

//
// ## loadManifest(file)
//
// Loads the manifest file a **file**, returning a pre-compiled version.
//
function loadManifest(file) {
  var data = JSON.parse(fs.readFileSync(rc.paths.manifest, 'utf8'))

  data.index = []

  function compile(name, obj, root) {
    if (typeof obj !== 'object') {
      return
    }

    obj.name = name

    if (obj.content) {
      obj.content = fs.readFileSync(path.join(root, obj.content), 'utf8')
    }

    if (obj.summary) {
      obj.summary = fs.readFileSync(path.join(root, obj.summary), 'utf8')
    }

    return obj
  }

  if (data.pages) {
    Object.keys(data.pages).forEach(function (key) {
      data.pages[key] = compile(key, data.pages[key], rc.paths.pages)
    })
  }

  if (data.articles) {
    Object.keys(data.articles).forEach(function (key, length) {
      var article = data.articles[key]

      article._index = new Date(article.published)
      article = compile(key, article, rc.paths.articles)

      data.index.push(article)
      data.articles[key] = article
    })
  }

  data.index.sort(function (a, b) {
    return b._index - a._index
  })

  return data
}

//
// ## configure(options)
//
// Creates a new Express middleware stack. If **options** is provided:
//
//  * **options.manifest** is used to index Articles.
//
function configure(options) {
  var opts = options || {}
    , manifest = opts.manifest
    , app = express()

  console.log('Manifest:', manifest)

  //
  // ## Configuration
  //
  app.set('views', rc.paths.templates)
  app.set('view engine', 'html')
  app.engine('html', consolidate.dust)

  //
  // ## Middleware
  //
  app
    .use(express.favicon(rc.favicon))
    .use(express.logger())
    .use(express.query())
    .use(app.router)
    .use(express.static(rc.paths.static))
    .use(express.errorHandler())

  //
  // ## Routes
  //
  function renderCallback(res, next) {
    return function (err, html) {
      if (err) {
        next(err)
        return
      }

      res.send(html)
    }
  }

  app.get('/:name', function (req, res, next) {
    res.render(
      'page',
      manifest.pages[req.params.name],
      renderCallback(res, next)
    )
  })

  app.get('/article/:name', function (req, res, next) {
    res.render(
      'article',
      manifest.articles[req.params.name],
      renderCallback(res, next)
    )
  })

  app.get('/', function (req, res, next) {
    var page = req.query.page || 0
      , start = page * rc.indexSize
      , length = manifest.index.length - start

    if (length > rc.indexSize) {
      length = rc.indexSize
    }

    res.render(
      'index',
      {
        articles: manifest.index.slice(start, start + length)
      },
      renderCallback(res, next)
    )
  })

  return app
}

//
// ## start
//
// Starts the server...
//
function start() {
  var port = process.env.PORT || rc.port

  console.log('Config:', rc)

  return http
    .createServer(configure({
      manifest: loadManifest(rc.paths.manifest)
    }))
    .listen(port, function (err) {
      if (err) {
        console.error(err.stack || err.message || err)
        process.exit(1)
      }

      console.log('Listening on port ' + port + '...')
    })
}

module.exports = {
  start: start
}
