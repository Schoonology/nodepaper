//
// # Renderer
//
// The Renderer is the top-most component of Nodepaper, responsible for delegating to all other components.
//
var fs = require('fs')
  , path = require('path')
  , LRU = require('lru-cache')
  , marked = require('marked')
  , dust = require('dustjs-linkedin')
  , nodefn = require('when/node/function')
  , when = require('when')
  , PostIndex = require('./postindex')
  , PREAMBLE_REGEX = /([a-z]+)\s*:(.*)/i

marked.setOptions({
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: true,
  smartLists: true
})

dust.helpers = {
  sep: function(chunk, context, bodies) {
    if (context.stack.index === context.stack.of - 1) {
      return chunk;
    }
    return bodies.block(chunk, context);
  },
  idx: function(chunk, context, bodies) {
    return bodies.block(chunk, context.push(context.stack.index));
  }
}

//
// ## Renderer `Renderer(obj)`
//
// Creates a new instance of Renderer with the following options:
//
function Renderer(obj) {
  if (!(this instanceof Renderer)) {
    return new Renderer(obj)
  }

  obj = obj || {}

  this.postdir = obj.postdir
  this.themedir = obj.themedir

  this._theme = null

  this._index = null
  this._initPostIndex()

  this._cache = LRU({
    max: 100,
    maxAge: 1000 * 60 * 60,
    length: function (value) { return value.length },
    dispose: function (key, value) {},
    stale: true
  })
}
Renderer.createRenderer = Renderer

//
// ## start `start()`
//
// Returns a promise to be fulfilled when all internal dependencies are ready and `index` and `single` calls can be
// made.
//
Renderer.prototype.start = start
function start() {
  var self = this

  return self
    ._index.start()
    .then(function () {
      return nodefn.call(fs.readFile, self.themedir)
    })
    .then(function (buffer) {
      self._theme = dust.compileFn(String(buffer))

      return self
    })
}

//
// ## preamble `preamble(name)`
//
// Returns a promise to be fulfilled with the **name** Post's preamble.
//
Renderer.prototype.preamble = preamble
function preamble(name) {
  var self = this

  return self
    ._load(name)
    .then(function (tuple) {
      return tuple.meta
    })
}

//
// ## index `index()`
//
// Returns a promise to be fulfilled with the index HTML contents.
//
Renderer.prototype.index = index
function index() {
  var self = this

  return when
    .map(
      self._index.slice(0, 3),
      function (meta) {
        return self._load(meta.name)
      }
    )
    .then(function (tuples) {
      return nodefn.call(self._theme, {
        index: true,
        content: tuples
      })
    })
}

//
// ## single `single(name)`
//
// Returns a promise to be fulfilled with the HTML for **name**.
//
Renderer.prototype.single = single
function single(name) {
  var self = this

  return self
    ._load(name)
    .then(function (tuple) {
      return nodefn.call(self._theme, {
        index: false,
        content: tuple
      })
    })
}

//
// ## _initPostIndex `_initPostIndex()`
//
// Internal use only.
//
Renderer.prototype._initPostIndex = _initPostIndex
function _initPostIndex() {
  var self = this

  this._index = new PostIndex({
    postdir: self.postdir,
    preamble: function (name) {
      return self.preamble(name)
    }
  })

  return self
}

//
// ## _load `_load(name)`
//
// Internal use only.
//
// Loads the entire contents of the **name** file, returning a promise to be fulfilled with { meta, md }.
//
Renderer.prototype._load = _load
function _load(name) {
  var self = this
    , cached = self._cache.get(name)

  if (cached) {
    return when(cached)
  }

  return nodefn
    .call(fs.readFile, path.join(self.postdir, name + '.md'), 'utf8')
    .then(function (file) {
      var data = self._parse(file)

      data = {
        meta: data.meta,
        html: marked(data.rest)
      }

      self._cache.set(name, data)

      return data
    })
}

//
// ## _parse `_parse(file)`
//
// Internal use only.
//
// Returns a tuple of {meta: rest} from the preamble and contents of **file**, respectively.
//
Renderer.prototype._parse = _parse
function _parse(file) {
  var self = this
    , data = {}
    , active = true
    , match
    , key
    , value

  file = file.split('\n').filter(function (line) {
    if (!active) {
      return true
    }

    line = line.trim()

    if (line.length === 0) {
      return false
    }

    match = PREAMBLE_REGEX.exec(line)

    if (!match) {
      active = false
      return true
    }

    key = match[1].toLowerCase()
    value = match[2].trim()

    data[key] = value
    return false
  }).join('\n')

  return {
    meta: data,
    rest: file
  }
}

module.exports = Renderer
