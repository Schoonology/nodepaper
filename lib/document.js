var path = require('path'),
    fs = require('fs'),
    url = require('url'),
    util = require('util'),
    mongodb = require('mongodb'),
    stepdown = require('stepdown');

var MONGO_URL_REGEX = new RegExp('^mongo(?:db)?://(?:|([^@/]*)@)([^@/]*)(?:|/([^?]*)(?:|\\?([^?]*)))$'),
    OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

var dbCache = {};

function Document() {
    if (!this instanceof Document) {
        return new Document();
    }

    this._path = null;
}

function addStatics(constructor) {
    constructor.loadFromPath = function (path, callback) {
        var inst = new constructor();
        return inst.loadFromPath(path, callback);
    };

    constructor.loadFromDisk = function (filepath, callback) {
        var inst = new constructor();
        return inst.loadFromDisk(filepath, callback);
    };

    constructor.loadFromMongo = function (path, callback) {
        var inst = new constructor();
        return inst.loadFromMongo(path, callback);
    };

    constructor.loadFromObject = function (object, callback) {
        var inst = new constructor();
        return inst.loadFromObject(object, callback);
    };

    constructor.extend = function (childConstFn) {
        util.inherits(childConstFn, constructor);
        addStatics(childConstFn);
    };
}
addStatics(Document);

Document.prototype.loadFromPath = function(path, callback) {
    if (MONGO_URL_REGEX.test(path)) {
        this.loadFromMongo(path, callback);
    } else if (typeof path === 'object') {
        this.loadFromObject(path, callback);
    } else if (typeof path === 'string') {
        this.loadFromDisk(path, callback);
    } else {
        callback(new Error('Invalid path'), null);
    }

    return this;
};

Document.prototype.saveToPath = function(path, callback) {
    if (typeof path === 'function') {
        callback = path;
        path = null;
    }

    if (path == null) {
        path = this._path;
    }

    if (MONGO_URL_REGEX.test(path)) {
        this.saveToMongo(path, callback);
    } else if (typeof path === 'object') {
        this.saveToObject(path, callback);
    } else if (typeof path === 'string') {
        this.saveToDisk(path, callback);
    } else {
        callback(new Error('Invalid path'), null);
    }

    return this;
};

Document.prototype.loadFromDisk = function(filepath, callback) {
    var resolvedPath;

    if (typeof filepath === 'function') {
        callback = filepath;
        filepath = null;
    }

    if (filepath) {
        resolvedPath = filepath;
    } else if (this._path) {
        resolvedPath = path.resolve(this._path);
    } else {
        callback(new Error('Invalid path'), null);
        return;
    }

    this._loadFromDisk(resolvedPath, callback);
    return this;
};

Document.prototype._loadFromDisk = function(resolvedPath, callback) {
    var self = this;

    fs.readFile(resolvedPath, function (err, data) {
        if (err) {
            callback(err, null);
            return;
        }

        var json = data.toString('utf8'),
            obj = null;

        try {
            obj = JSON.parse(json);
        } catch(e) {
            callback(e, null);
            return;
        }

        this._path = resolvedPath;
        self.loadFromObject(obj, callback);
    });
};

Document.prototype.saveToDisk = function(filepath, callback) {
    if (typeof filepath === 'function') {
        callback = filepath;
        filepath = this._path;
    } else if (filepath == null) {
        filepath = this._path;
    }

    if (!filepath) {
        callback(new Error('No path provided.'), null);
        return;
    }

    this._saveToDisk(path.resolve(filepath), callback);
    return this;
};

Document.prototype._saveToDisk = function(resolvedPath, callback) {
    fs.writeFile(resolvedPath, JSON.stringify(this, null, 4), 'utf8', callback);
};

Document.prototype.loadFromMongo = function(path, callback) {
    var self = this;

    stepdown([function getDbClient() {
        self._getMongoCollection(path, this.next);
    }, function load(collection, remainingPath) {
        self._loadFromMongo(collection, remainingPath.join('/'), callback);
    }], function errorHandler(err) {
        callback(err, null);
    });

    return this;
};

Document.prototype._getMongoCollection = function(path, callback) {
    this._getMongoDB(path, function (err, client, path) {
        if (err) {
            callback(err, null);
            return;
        }

        var collection = path.shift();
        client.collection(collection, function (err, collection) {
            callback(err, collection, collection ? path : null);
        });
    });
};

Document.prototype._getMongoDB = function(path, callback) {
    if (typeof path === 'function') {
        callback = path;
        path = null;
    }

    var parsed = url.parse(path || this._path),
        database,
        collection,
        id,
        self = this;

    if (!parsed.host) {
        callback(new Error('Invalid path'), null);
        return;
    }

    path = parsed.pathname.split('/').slice(1);

    if (path.length < 2) {
        callback(new Error('Invalid path'), null);
        return;
    }

    database = path.shift();

    if (dbCache[database]) {
        callback(null, dbCache[database], path);
        return;
    }

    var client = new mongodb.Db(database, new mongodb.Server(parsed.hostname, parseInt(parsed.port, 10), {}));

    client.open(function (err, client) {
        if (err) {
            callback(err, null);
            return;
        }

        dbCache[database] = client;
        callback(null, client, path);
    });
};

Document.prototype._loadFromMongo = function(collection, id, callback) {
    var self = this;

    if (!id) {
        callback(new Error('Invalid path'), null);
        return;
    }

    stepdown([function getDocument() {
        if (OBJECT_ID_REGEX.test(id)) {
            id = new mongodb.ObjectID(id);
        }

        collection.findOne({
            _id: id
        }, this.next);
    }, function loadValues(doc) {
        if (doc) {
            self._path = util.format('mongo://%s:%s/%s/%s/%s',
                collection.db.serverConfig.host,
                collection.db.serverConfig.port,
                collection.db.databaseName,
                collection.collectionName,
                id);
        }

        var context = require('repl').start({}).context;
        context.collection = collection;
        context.id = id;

        self.loadFromObject(doc, callback);
    }]).on('error', callback || function () {}); // HACK around calling loadValues differently if this isn't here.
};

Document.prototype.saveToMongo = function(path, callback) {
    var self = this;

    if (typeof path === 'function') {
        callback = path;
        path = self._path;
    } else if (path == null) {
        path = self._path;
    }

    if (!path) {
        callback(new Error('No path provided.'), null);
        return;
    }

    stepdown([function getDbClient() {
        self._getMongoCollection(path, this.next);
    }, function load(collection, remainingPath) {
        self._saveToMongo(collection, remainingPath.join('/'), callback);
    }], function errorHandler(err) {
        callback(err, null);
    });

    return this;
};

Document.prototype._saveToMongo = function(collection, id, callback) {
    var doc = this.toObject();

    doc._id = id;

    collection.update({
        _id: id
    }, doc, {
        upsert: true
    }, callback);
};

Document.prototype.loadFromObject = function(object, callback) {
    if (object == null) {
        callback(new Error('Invalid value'), null);
        return;
    }

    this._loadFromObject(object, callback);
    return this;
};

Document.prototype._loadFromObject = function(object, callback) {
    callback(null, this);
};

Document.prototype.saveToObject = function(object, callback) {
    if (object == null) {
        callback(new Error('Invalid value'), null);
        return;
    }

    this._saveToObject(object, callback);
    return this;
};

Document.prototype._saveToObject = function(object, callback) {
    callback(null, object);
};

Document.prototype.toObject = function() {
    var obj = {};

    this.saveToObject(obj);

    return obj;
};

Document.prototype.toJSON = function() {
    return this.toObject();
};

module.exports = Document;
