var mongodb = require('mongodb')

//
// # MongoQueue
//
function MongoQueue(obj) {
  if (!(this instanceof MongoQueue)) {
    return new MongoQueue(obj)
  }

  this.client = null
  this.collections = {}
  // TODO
  this._queue = []
}
MongoQueue.createMongoQueue = MongoQueue

//
// ## connect `connect(options, callback)`
//
// Connects to MongoDB.
//
MongoQueue.prototype.connect = connect
function connect(options, callback) {
  var self = this
    , host = options.host
    , port = options.port
    , database = options.database
    , server = new mongodb.Server(host, port, {})
    , db = new mongodb.Db(database, server, { w: 1 })

  db.open(function (err, client) {
    if (err) {
      callback(err)
      return
    }

    self.client = client
    callback(null)
  })
}

//
// ## getCollection `getCollection(options, callback)`
//
// Retrieves a Collection from MongoDB.
//
MongoQueue.prototype.getCollection = getCollection
function getCollection(options, callback) {
  var self = this
    , name = options.name
    , collection = self.collections[name]

  if (!self.client) {
    throw new Error('No Connection')
  }

  if (!collection) {
    collection = self.collections[name] = new mongodb.Collection(self.client, name)
  }

  return collection
}

// TODO?
module.exports = new MongoQueue()
