//
// # Content
//
// Responsible for loading content from the filesystem, parsing that content into HTML and metadata, and
// cacheing frequently requested content in memory.
//
var fs = require('fs')
  , path = require('path')
  , debug = require('debug')('nodepaper:content')
  , LRU = require('lru-cache')
  , marked = require('marked')
  , nodefn = require('when/node/function')
  , when = require('when')
  , PREAMBLE_REGEX = /([a-z]+)\s*:(.*)/i

marked.setOptions({
  sanitize: false
})

//
// ## Content `Content(obj)`
//
// Creates a new instance of Content with the following options:
//
//  * `postdir` - The directory containing Markdown files suitable for parsing and serving to clients.
//
function Content(obj) {
  if (!(this instanceof Content)) {
    return new Content(obj)
  }

  obj = obj || {}

  this.postdir = obj.postdir

  this._cache = LRU({
    max: 100,
    maxAge: 1000 * 60 * 60,
    length: function (value) { return value.length },
    dispose: function (key, value) {},
    stale: true
  })
}
Content.createContent = Content

//
// ## get `get(name)`
//
// Returns a promise to be fulfilled with { meta, html } for the **name** Post.
//
Content.prototype.get = get
function get(name) {
  var self = this

  debug('Getting: %s', name)

  return self._load(name)
}

//
// ## remove `remove(name)`
//
// Returns a promise to be fulfilled when any cached data for **name** has been removed.
//
Content.prototype.remove = remove
function remove(name) {
  var self = this

  self._cache.del(name)

  return when(self)
}

//
// ## _load `_load(name)`
//
// Internal use only.
//
// Loads the entire contents of the **name** file, returning a promise to be fulfilled with { meta, html }.
//
Content.prototype._load = _load
function _load(name) {
  var self = this
    , cached = self._cache.get(name)

  if (cached) {
    debug('Loaded %s from cache.', name)
    return when(cached)
  }

  return nodefn
    .call(fs.readFile, path.join(self.postdir, name + '.md'), 'utf8')
    .then(function (file) {
      var data = self._parse(file)

      debug('Loaded %s from filesystem.', name)

      // Additional metadata
      data.meta.name = name
      data.meta.link = data.meta.link || '/' + name

      // Pre-processing and reformatting
      data.meta.date = Date.parse(data.meta.date)
      data.meta.type = data.meta.type ? data.meta.type.toLowerCase() : 'post'

      data = {
        meta: data.meta,
        html: marked(data.rest)
      }

      debug('Writing %s to cache.', name)

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
Content.prototype._parse = _parse
function _parse(file) {
  var self = this
    , data = {}
    , active = true
    , match
    , key
    , value

  debug('Parsing preamble...')

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

module.exports = Content
