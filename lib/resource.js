var lib = require('../lib')
  , Model = lib('model')

//
// # Resource
//
function Resource(obj) {
  if (!(this instanceof Resource)) {
    return new Resource(obj)
  }

  Model.call(this, obj)

  this.content = obj.content
}
Model.extend(Resource)
Resource.createResource = Resource
Resource.COLLECTION_NAME = ''

//
// ## toBSON `toBSON()`
//
// Returns the expected BSON-compatible representation of this Resource as an Object.
//
Resource.prototype.toBSON = toBSON
function toBSON() {
  var self = this
    , bson = Model.prototype.toBSON.call(self)

  bson.content = self.content

  return bson
}

module.exports = Resource
