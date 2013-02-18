var util = require('util')
  , mongo = require('../mongo')

//
// # Model
//
function Model(obj) {
  if (!(this instanceof Model)) {
    return new Model(obj)
  }

  this.name = obj._id
}
Model.createModel = Model
Model.COLLECTION_NAME = ''

//
// ## extend `Model.extend(Class)`
//
// Extends **Class** both prototypically and statically with all of the methods and properties of `Model`.
//
Model.extend = function (Class) {
  var cls = this

  util.inherits(Class, cls)

  Object.keys(cls).forEach(function (key) {
    Class[key] = cls[key]
  })
}

//
// ## getCollection `Model.getCollection()`
//
// Retrieves the class's collection from MongoDB.
//
Model.getCollection = getCollection
function getCollection() {
  var cls = this

  return cls.collection || (cls.collection = mongo.getCollection({
    name: cls.COLLECTION_NAME
  }))
}

//
// ## load `Model.load(options, callback)`
//
// Loads the Model at **options.name**.
//
Model.load = load
function load(options, callback) {
  var cls = this
    , name = options.name || 'index'

  cls.getCollection().find({
    _id: name
  }).nextObject(function (err, obj) {
    if (err) {
      callback(err, null)
      return
    }

    if (!obj) {
      callback(null, null)
      return
    }

    callback(null, new cls(obj))
  })
}

//
// ## save `Model.save(callback)`
//
// Saves **options.body** to **options.name**.
//
Model.save = save
function save(options, callback) {
  var cls = this
    , name = options.name
    , body = options.body

  console.log('Saving:', body)

  if (!body.name) {
    body.name = name
  }

  // TODO: toBSON?
  cls.getCollection().save(cls.prototype.toBSON.call(body), callback)
}

//
// ## remove `Model.remove(options, callback)`
//
// Deletes the Model at **options.name**.
//
Model.remove = remove
function remove(options, callback) {
  var cls = this
    , name = options.name || 'index'

  console.log('Removing:', name)

  cls.getCollection().remove({
    _id: name
  }, callback)
}

//
// ## find `Model.find(options, callback)`
//
// Finds all the available resources, responding with a list of names.
//
Model.find = find
function find(options, callback) {
  var cls = this

  cls.getCollection().find({}, {
    _id: 1
  }).toArray(function (err, list) {
    if (err) {
      callback(err, null)
      return
    }

    callback(err, list.map(function (item) {
      return {
        name: item._id
      }
    }))
  })
}

//
// ## toBSON `toBSON()`
//
// Returns the expected BSON-compatible representation of this Model as an Object.
//
Model.prototype.toBSON = toBSON
function toBSON() {
  var self = this

  return {
    _id: self.name
  }
}

module.exports = Model
