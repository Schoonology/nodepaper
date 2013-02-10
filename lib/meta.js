var lib = require('../lib')
  , $$ = require('stepdown')
  , Resource = lib('resource')
  , rc = lib('rc')

//
// # Meta
//
function Meta(obj) {
  if (!(this instanceof Meta)) {
    return new Meta(obj)
  }

  this.name = obj._id
  this.theme = obj.theme || 'default'
  this.title = obj.title || 'Nodepaper'
}
Resource.extend(Meta)
Meta.createMeta = Meta
Meta.COLLECTION_NAME = rc.collections.meta

//
// ## toBSON `toBSON()`
//
// Returns the expected BSON-compatible representation of this Meta as an Object.
//
Meta.prototype.toBSON = toBSON
function toBSON() {
  var self = this

  return {
    _id: self.name,
    title: self.title
  }
}

//
// ## load `Meta.load(options, callback)`
//
// Loads the Meta at **options.name**.
//
Meta.load = load
function load(options, callback) {
  var cls = this

  Resource.load.call(cls, {
    name: 'meta'
  }, callback)
}

//
// ## save `Meta.save(callback)`
//
// Saves **options.body** to **options.name**.
//
Meta.save = save
function save(options, callback) {
  var cls = this
    , body = options.body

  Resource.save.call(cls, {
    name: 'meta',
    body: body
  }, callback)
}

module.exports = Meta
