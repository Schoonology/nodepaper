var lib = require('../lib')
  , $$ = require('stepdown')
  , Resource = lib('resource')
  , rc = lib('rc')

//
// # Page
//
function Page(obj) {
  if (!(this instanceof Page)) {
    return new Page(obj)
  }

  Resource.call(this, obj)
}
Resource.extend(Page)
Page.createPage = Page
Page.COLLECTION_NAME = rc.collections.pages

module.exports = Page
