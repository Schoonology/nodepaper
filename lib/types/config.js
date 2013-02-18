var lib = require('../')
  , Model = lib('types/model')
  , rc = lib('rc')

//
// # Config
//
function Config(obj) {
  if (!(this instanceof Config)) {
    return new Config(obj)
  }

  Model.call(this, obj)

  this.theme = obj.theme || 'default'
  this.title = obj.title || 'Nodepaper'
}
Model.extend(Config)
Config.createMeta = Config
Config.COLLECTION_NAME = rc.collections.meta

//
// ## toBSON `toBSON()`
//
// Returns the expected BSON-compatible representation of this Config as an Object.
//
Config.prototype.toBSON = toBSON
function toBSON() {
  var self = this
    , bson = Model.prototype.toBSON.call(self)

  bson.theme = self.theme
  bson.title = self.title

  return bson
}

//
// ## load `Config.load(options, callback)`
//
// Loads the Config at **options.name**.
//
Config.load = load
function load(options, callback) {
  var cls = this

  Model.load.call(cls, {
    name: 'config'
  }, callback)
}

//
// ## save `Config.save(callback)`
//
// Saves **options.body** to **options.name**.
//
Config.save = save
function save(options, callback) {
  var cls = this
    , body = options.body

  Model.save.call(cls, {
    name: 'config',
    body: body
  }, callback)
}

module.exports = Config
