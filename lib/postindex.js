//
// # PostIndex
//
// The PostIndex is responsible for indexing all content.
//
var path = require('path')
  , sorted = require('sorted')
  , watch = require('watch')
  , when = require('when')

//
// ## PostIndex `PostIndex(obj)`
//
// Creates a new instance of PostIndex with the following options:
//
//  * `preamble` - A Function that accepts one parameter, `name`, returning a promise to be fulfilled with the preamble
//  of that Post.
//
function PostIndex(obj) {
  if (!(this instanceof PostIndex)) {
    return new PostIndex(obj)
  }

  obj = obj || {}

  this.preamble = obj.preamble
  this.postdir = obj.postdir

  this._pages = []
  this._posts = sorted(function (a, b) {
    return b.date - a.date
  })
}
PostIndex.createPostIndex = PostIndex

//
// ## start `start()`
//
// Returns a promise to be fulfilled when all internal dependencies are ready and `slice` calls can be made.
//
PostIndex.prototype.start = start
function start() {
  var self = this

  watch.watchTree(self.postdir, function (f, curr, prev) {
    if (typeof f === 'object' && prev === null && curr === null) {
      Object.keys(f).forEach(function (key) {
        self.update(key)
      })
    } else if (curr.nlink === 0) {
      self.remove(f)
    } else {
      self.update(f)
    }
  })

  return when(self)
}

//
// ## getName `getName(file)`
//
// Returns either the basename-extname of **file** or null.
//
PostIndex.prototype.getName = getName
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
PostIndex.prototype.update = update
function update(file) {
  var self = this
    , name = self.getName(file)

  if (!name) {
    return when(self)
  }

  return self
    .remove(file)
    .then(function () {
      return self.preamble(name)
    })
    .then(function (meta) {
      // Pre-processing
      meta.date = Date.parse(meta.date)
      meta.type = meta.type ? meta.type.toLowerCase() : 'post'

      switch (meta.type) {
        case 'page':
          self._pages[name] = meta
          break
        case 'post':
        default:
          meta.index = self._posts.findIndex(meta)
          self._posts.push(meta)
          self._posts[name] = meta
          break
      }

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
PostIndex.prototype.remove = remove
function remove(file) {
  var self = this
    , name = self.getName(file)
    , existing

  if (!name) {
    return when(self)
  }

  if (self._pages[name]) {
    ;delete self._pages[name]
  }

  if (self._posts[name]) {
    self._posts.splice(self._posts[name].index, 1)
    ;delete self._posts[name]
  }

  return when(self)
}

//
// ## posts `posts(start, end)`
//
// Returns a promise to be fulfilled with a slice of Posts from **start** to **end**.
//
PostIndex.prototype.posts = posts
function posts(start, end) {
  var self = this

  return when(self._posts.slice(start, end).toArray())
}

//
// ## pages `pages()`
//
// Returns a promise to be fulfilled with all available Pages.
//
PostIndex.prototype.pages = pages
function pages() {
  var self = this

  return when(Object.keys(self._pages).sort().map(function (key) {
    return self._pages[key]
  }))
}

module.exports = PostIndex
