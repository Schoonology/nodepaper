var lib = require('../')
  , Resource = lib('types/resource')
  , rc = lib('rc')

//
// # Page
//
function Page(obj) {
  if (!(this instanceof Page)) {
    return new Page(obj)
  }

  Resource.call(this, obj)

  this.title = obj.title || ''
}
Resource.extend(Page)
Page.createPage = Page
Page.COLLECTION_NAME = rc.collections.pages

//
// ## toBSON `toBSON()`
//
// Returns the expected BSON-compatible representation of this Page as an Object.
//
Page.prototype.toBSON = toBSON
function toBSON() {
  var self = this
    , bson = Resource.prototype.toBSON.call(self)

  bson.title = self.title

  return bson
}

module.exports = Page
