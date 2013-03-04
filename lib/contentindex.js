//
// # ContentIndex
//
// The ContentIndex is responsible for indexing all content retrieved via Content.
//
var path = require('path')
  , debug = require('debug')('nodepaper:contentindex')
  , sorted = require('sorted')
  , watch = require('watch')
  , when = require('when')
  , Content = require('./content')

//
// ## ContentIndex `ContentIndex(obj)`
//
// Creates a new instance of ContentIndex with the following options:
//
//  * `postdir` - The directory containing Markdown files suitable for parsing and serving to clients.
//
function ContentIndex(obj) {
  if (!(this instanceof ContentIndex)) {
    return new ContentIndex(obj)
  }

  obj = obj || {}

  this.postdir = obj.postdir

  this._content = new Content(obj)

  this._pages = []
  this._posts = sorted(function (a, b) {
    return b.date - a.date
  })
}
ContentIndex.createContentIndex = ContentIndex

//
// ## start `start()`
//
// Returns a promise to be fulfilled when all internal dependencies are ready and `slice` calls can be made.
//
ContentIndex.prototype.start = start
function start() {
  var self = this

  debug('Starting to watch %s...', self.postdir)

  watch.watchTree(self.postdir, function (f, curr, prev) {
    if (typeof f === 'object' && prev === null && curr === null) {
      Object.keys(f).forEach(function (key) {
        self
          .update(key)
          .then(null, console.error)
      })
    } else if (curr.nlink === 0) {
      self
        .remove(f)
        .then(null, console.error)
    } else {
      self
        .update(f)
        .then(null, console.error)
    }
  })

  return when(self)
}

//
// ## getName `getName(file)`
//
// Returns either the basename-extname of **file** or null.
//
ContentIndex.prototype.getName = getName
function getName(file) {
  var self = this
    , name = path.relative(self.postdir, file)
    , extname = path.extname(name)

  if (['.md'].indexOf(extname) < 0) {
    return null
  }

  return path.basename(name, extname)
}

//
// ## update `update(file)`
//
// Updates the sorted post index with the metadata from **file**.
//
// Returns a promise that is fulfilled once the index is updated.
//
ContentIndex.prototype.update = update
function update(file) {
  var self = this
    , name = self.getName(file)

  if (!name) {
    debug('Got an update to %s, which is not a Markdown file.', file)
    return when(self)
  }

  debug('Updating %s from %s...', name, file)

  console.log('BEFORE', JSON.stringify(self._posts, null, 2))

  return self
    .remove(file)
    .then(function () {
      return self._content.get(name)
    })
    .then(function (tuple) {
      return tuple.meta
    })
    .then(function (meta) {
      debug('Parsed: %s', JSON.stringify(meta, null, 2))

      switch (meta.type) {
        case 'page':
          self._pages[name] = meta

          debug('Added %s as a Page.', name)
          break
        case 'post':
        default:
          self._posts.push(meta)
          self._posts[name] = meta

          debug('Added %s as a Post.', name)
          break
      }

      console.log('AFTER', JSON.stringify(self._posts, null, 2))

      return self
    })
}

//
// ## remove `remove(file)`
//
// Removes the index record for **file**.
//
// Returns a promise that is fulfilled once the index is updated.
//
ContentIndex.prototype.remove = remove
function remove(file) {
  var self = this
    , name = self.getName(file)
    , existing

  if (!name) {
    debug('Got a removal for %s, which is not a Markdown file.', file)
    return when(self)
  }

  debug('Removing %s...', name)
  self._content.remove(name)

  if (self._pages[name]) {
    ;delete self._pages[name]

    debug('Removed %s from pages.', name)
  }

  if (self._posts[name]) {
    self._posts.splice(self._posts.indexOf(self._posts[name]), 1)
    ;delete self._posts[name]

    debug('Removed %s from posts.', name)
  }

  console.log('MIDDLE', JSON.stringify(self._posts, null, 2))

  return when(self)
}

//
// ## get `get(name)`
//
// Returns a promise to be fulfilled with { meta, html } for the **name** Post.
//
ContentIndex.prototype.get = get
function get(name) {
  var self = this

  debug('Getting: %s', name)

  return self._content.get(name)
}

//
// ## posts `posts(start, end)`
//
// Returns a promise to be fulfilled with a slice of Posts from **start** to **end**.
//
ContentIndex.prototype.posts = posts
function posts(start, end) {
  var self = this

  debug('Getting Posts from %d to %d...', start, end)

  return when
    .map(
      self._posts.slice(start, end).toArray(),
      function (meta) {
        return self.get(meta.name)
      }
    )
}

//
// ## pages `pages()`
//
// Returns a promise to be fulfilled with all available Pages.
//
ContentIndex.prototype.pages = pages
function pages() {
  var self = this

  debug('Getting all Pages...')

  return when(Object.keys(self._pages).sort().map(function (key) {
    return self._pages[key]
  }))
}

module.exports = ContentIndex
