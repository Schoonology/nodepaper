var fs = require('fs')
  , path = require('path')
  , util = require('util')
  , mongo = require('./mongo')
  , $$ = require('stepdown')

//
// # Resource
//
function Resource(obj) {
  if (!(this instanceof Resource)) {
    return new Resource(obj)
  }

  this.name = obj._id
  this.content = obj.content
}
Resource.createResource = Resource
Resource.COLLECTION_NAME = ''

//
// ## extend `Resource.extend(Class)`
//
// Extends **Class** both prototypically and statically with all of the methods and properties of `Resource`.
//
Resource.extend = function (Class) {
  var cls = this

  util.inherits(Class, cls)

  Object.keys(cls).forEach(function (key) {
    Class[key] = cls[key]
  })
}

//
// ## getCollection `Resource.getCollection()`
//
// Retrieves the class's collection from MongoDB.
//
Resource.getCollection = getCollection
function getCollection() {
  var cls = this

  return cls.collection || (cls.collection = mongo.getCollection({
    name: cls.COLLECTION_NAME
  }))
}

//
// ## load `Resource.load(options, callback)`
//
// Loads the resource at **options.name**.
//
Resource.load = load
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
// ## save `Resource.save(callback)`
//
// Saves **options.body** to **options.name**.
//
Resource.save = save
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
// ## remove `Resource.remove(options, callback)`
//
// Deletes the resource at **options.name**.
//
Resource.remove = remove
function remove(options, callback) {
  var cls = this
    , name = options.name || 'index'

  console.log('Removing:', name)

  cls.getCollection().remove({
    _id: name
  }, callback)
}

//
// ## find `Resource.find(options, callback)`
//
// Finds all the available resources, responding with a list of names.
//
Resource.find = find
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
// Returns the expected BSON-compatible representation of this Resource as an Object.
//
Resource.prototype.toBSON = toBSON
function toBSON() {
  var self = this

  return {
    _id: self.name,
    content: self.content
  }
}

module.exports = Resource
