var lib = require('../lib')
  , $$ = require('stepdown')
  , Resource = lib('resource')
  , rc = lib('rc')

//
// # Author
//
function Article(obj) {
  if (!(this instanceof Article)) {
    return new Article(obj)
  }

  Resource.call(this, obj)
}
Resource.extend(Article)
Article.createPage = Article
Article.COLLECTION_NAME = rc.collections.articles

module.exports = Article
