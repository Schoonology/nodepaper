var lib = require('../lib')
  , $$ = require('stepdown')
  , Resource = lib('resource')
  , rc = lib('rc')

//
// # Article
//
// Articles are focused around their date of publication.
//
function Article(obj) {
  if (!(this instanceof Article)) {
    return new Article(obj)
  }

  Resource.call(this, obj)

  this.title = obj.title || ''
  this.published = obj.published || null
}
Resource.extend(Article)
Article.createPage = Article
Article.COLLECTION_NAME = rc.collections.articles

//
// ## toBSON `toBSON()`
//
// Returns the expected BSON-compatible representation of this Article as an Object.
//
Article.prototype.toBSON = toBSON
function toBSON() {
  var self = this
    , bson = Resource.prototype.toBSON.call(self)

  bson.title = self.title

  if (self.published === true) {
    bson.published = Date.now()
  } else {
    bson.published = self.published
  }

  return bson
}

//
// ## getPublished `Article.getPublished(options, callback)`
//
// TODO: Description.
//
Article.getPublished = getPublished
function getPublished(options, callback) {
  var cls = this
    , skip = options.skip || 0
    , limit = options.limit || 10

  cls
    .getCollection()
    .find(
      {
        published: {
          $ne: null
        }
      },
      {
        _id: 1
      }
    )
    .sort({
      published: -1
    })
    .skip(skip)
    .limit(limit)
    .toArray(callback)
}

module.exports = Article
