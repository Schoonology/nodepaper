var lib = require('../lib')
  , $$ = require('stepdown')
  , Resource = lib('resource')
  , rc = lib('rc')

//
// # Media
//
function Media(obj) {
  if (!(this instanceof Media)) {
    return new Media(obj)
  }

  Resource.call(this, obj)
}
Resource.extend(Media)
Media.createPage = Media
Media.root = rc.paths.media

module.exports = Media
