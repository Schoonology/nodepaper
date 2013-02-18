var lib = require('../')
  , Model = lib('types/model')
  , rc = lib('rc')

//
// # Settings
//
// While `rc` controls the static, operational configuration for Nodepaper, the Settings doc(s) control the
// dynamic application settings: themes, titles, etc.
//
function Settings(obj) {
  if (!(this instanceof Settings)) {
    return new Settings(obj)
  }

  if (!Settings._doc) {
    Settings._doc = this
  }

  Model.call(this, obj)

  this.theme = obj.theme || 'default'
  this.title = obj.title || 'Nodepaper'
}
Model.extend(Settings)
Settings.createMeta = Settings
Settings.COLLECTION_NAME = rc.collections.meta

// For Settings, we want to cache the single Settings document globally.
Settings._doc = null

//
// ## toBSON `toBSON()`
//
// Returns the expected BSON-compatible representation of this Settings as an Object.
//
Settings.prototype.toBSON = toBSON
function toBSON() {
  var self = this
    , bson = Model.prototype.toBSON.call(self)

  bson.theme = self.theme
  bson.title = self.title

  return bson
}

//
// ## load `Settings.load(options, callback)`
//
// Loads the singleton Settings doc.
//
Settings.load = load
function load(options, callback) {
  var cls = this

  if (Settings._doc) {
    callback(null, Settings._doc)
    return
  }

  Model.load.call(cls, {
    name: 'settings'
  }, function (err, doc) {
    if (err || doc) {
      callback(err, doc)
      return
    }

    callback(null, new Settings({}))
  })
}

//
// ## save `Settings.save(callback)`
//
// Saves **options.body** to the singleton Settings doc.
//
Settings.save = save
function save(options, callback) {
  var cls = this
    , body = options.body

  if (Settings._doc) {
    Settings.call(Settings._doc, body)
    body = Settings._doc
  }

  Model.save.call(cls, {
    name: 'settings',
    body: body
  }, callback)
}

module.exports = Settings
