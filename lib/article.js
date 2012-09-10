var path = require('path'),
    fs = require('fs'),
    url = require('url'),
    marked = require('marked'),
    mongodb = require('mongodb'),
    stepdown = require('stepdown');

var MONGO_URL_REGEX = new RegExp('^mongo(?:db)?://(?:|([^@/]*)@)([^@/]*)(?:|/([^?]*)(?:|\\?([^?]*)))$'),
    OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

var dbCache = {};

function Article(path) {
    this.type = 'text';
    this.content = null;
    this.path = path || null;

    if (path) {
        this.loadFromPath(path, function (err) {
            // TODO: Sync?
            if (err) {
                console.error('Error in Article creation:', err.stack || err.message);
                return;
            }
        });
    }
}

Article.loadFromPath = function (path, callback) {
    var a = new Article();
    return a.loadFromPath(path, callback);
};

Article.prototype.loadFromPath = function(path, callback) {
    this.path = path;

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

Article.prototype.saveToPath = function(path, callback) {
    if (typeof path === 'function') {
        callback = path;
        path = null;
    }

    if (path == null) {
        path = this.path;
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

Article.loadFromDisk = function (filepath, callback) {
    var a = new Article();
    return a.loadFromDisk(filepath, callback);
};

Article.prototype.loadFromDisk = function(filepath, callback) {
    var resolvedPath;

    if (typeof filepath === 'function') {
        callback = filepath;
        filepath = null;
    }

    if (filepath) {
        resolvedPath = filepath;
    } else if (this.path) {
        this.path = resolvedPath = path.resolve(this.path);
    } else {
        callback(new Error('Invalid path'), null);
        return;
    }

    this._loadFromDisk(resolvedPath, callback);
    return this;
};

Article.prototype._loadFromDisk = function(resolvedPath, callback) {
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

        self.loadFromObject(obj, callback);
    });
};

Article.prototype.saveToDisk = function(filepath, callback) {
    if (typeof filepath === 'function') {
        callback = filepath;
        filepath = null;
    }

    if (!(filepath || this.path)) {
        callback(new Error('No path provided.'), null);
        return;
    }

    this._saveToDisk((filepath && path.resolve(filepath)) || this.path, callback);
    return this;
};

Article.prototype._saveToDisk = function(resolvedPath, callback) {
    fs.writeFile(resolvedPath, JSON.stringify(this, null, 4), 'utf8', callback);
};

Article.loadFromMongo = function (path, callback) {
    var a = new Article();
    return a.loadFromMongo(path, callback);
};

Article.prototype.loadFromMongo = function(path, callback) {
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

Article.prototype._getMongoCollection = function(path, callback) {
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

Article.prototype._getMongoDB = function(path, callback) {
    if (typeof path === 'function') {
        callback = path;
        path = null;
    }

    var parsed = url.parse(path || this.path),
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

Article.prototype._loadFromMongo = function(collection, id, callback) {
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
        self.loadFromObject(doc, callback);
    }], callback);
};

Article.prototype.saveToMongo = function(path, callback) {
    var self = this;

    stepdown([function getDbClient() {
        self._getMongoCollection(path, this.next);
    }, function load(collection, remainingPath) {
        self._saveToMongo(collection, remainingPath.join('/'), callback);
    }], function errorHandler(err) {
        callback(err, null);
    });

    return this;
};

Article.prototype._saveToMongo = function(collection, id, callback) {
    var doc = this.toObject();

    doc._id = id;

    collection.update({
        _id: id
    }, doc, {
        upsert: true
    }, callback);
};

Article.loadFromObject = function (object, callback) {
    var a = new Article();
    return a.loadFromObject(object, callback);
};

Article.prototype.loadFromObject = function(object, callback) {
    if (object == null) {
        callback(new Error('Invalid value'), null);
        return;
    }

    this.type = object.type;
    this.content = object.content;

    callback(null, this);
    return this;
};

Article.prototype.saveToObject = function(object, callback) {
    if (object == null) {
        callback(new Error('Invalid value'), null);
        return;
    }

    object.type = this.type;
    object.content = this.content;

    callback(null, object);
    return this;
};

Article.prototype.toObject = function() {
    return {
        type: this.type,
        content: this.content
    };
};

Article.prototype.toJSON = function() {
    return this.toObject();
};

Article.prototype.getContent = function() {
    if (this.type === 'markdown') {
        return marked(this.content);
    } if (this.type === 'text' || this.type === 'html') {
        return this.content;
    } else {
        return this.content;
    }
};

module.exports = Article;
