//
// # PostIndex
//
// TODO: Description.
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

  this._index = sorted(function (a, b) {
    return b.date - a.date
  })
}
PostIndex.createPostIndex = PostIndex

//
// ## start `start()`
//
// TODO: Description.
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
    .preamble(name)
    .then(function (meta) {
      // Pre-processing
      meta.name = name
      meta.date = Date.parse(meta.date)

      if (self._index[name]) {
        self._index.splice(self._index[name].index, 1)
      }

      meta.index = self._index.findIndex(meta)
      self._index.push(meta)
      self._index[name] = meta

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

  if (!self._index[name]) {
    return when(self)
  }

  self._index.splice(self._index[name].index, 1)
  ;delete self._index[name]

  return when(self)
}

//
// ## slice `slice(start, end)`
//
// Returns a promis to be fulfilled with a slice of index from **start** to **end**.
//
PostIndex.prototype.slice = slice
function slice(start, end) {
  var self = this

  return when(self._index.slice(start, end).toArray())
}

module.exports = PostIndex
