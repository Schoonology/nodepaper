var lib = require('../lib')
  , $$ = require('stepdown')
  , Resource = lib('resource')
  , rc = lib('rc')

//
// # Author
//
function Author(obj) {
  if (!(this instanceof Author)) {
    return new Author(obj)
  }

  Resource.call(this, obj)
}
Resource.extend(Author)
Author.createPage = Author
Author.root = rc.paths.authors

module.exports = Author
