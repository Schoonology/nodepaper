var path = require('path'),
    fs = require('fs'),
    url = require('url'),
    util = require('util'),
    mongodb = require('mongodb'),
    stepdown = require('stepdown'),
    Document = require('./document');

function Collection(type) {
    if (!(this instanceof Collection)) {
        return new Collection(type);
    }

    Document.call(this);

    this.type = type;
    this.documents = {};
}
Document.extend(Collection);

Collection.prototype._loadFromDisk = function(resolvedPath, callback) {
    var self = this;

    stepdown([function findFiles() {
        fs.readdir(resolvedPath, this.next);
    }, function loadArticles(filenames) {
        var addGroupResult = this.createGroup();

        filenames.forEach(function (filename) {
            var filepath = path.join(resolvedPath, filename),
                callback = addGroupResult();

            self.type.loadFromDisk(filepath, function (err, doc) {
                if (err) {
                    if (err.code === 'EISDIR') {
                        callback(null, null);
                        return;
                    }

                    callback(err, null);
                    return;
                }

                self.documents[filename] = doc;
                callback(null, doc);
            });
        });
    }, function finished(results) {
        callback(null, self);
    }], callback);
};

Collection.prototype._saveToDisk = function(resolvedPath, callback) {
    var self = this;

    stepdown([function saveAll() {
        var addGroupResult = this.createGroup();

        Object.keys(self.documents).forEach(function (key) {
            self.documents[key].saveToDisk(path.join(resolvedPath, key), addGroupResult());
        });
    }, function finished(results) {
        callback(null, self);
    }], callback);
};

Collection.prototype._loadFromMongo = function(collection, id, callback) {
    var self = this;

    stepdown([function loadCollection() {
        if (id) {
            Document.prototype._loadFromMongo.call(collection, id, this.next);
            return;
        }

        var next = this.next;
        collection.find({}, {}, function gotCursor(err, cursor) {
            if (err) {
                callback(err, null);
                return;
            }

            cursor.toArray(next);
        });
    }, function parseCollection(data) {
        if (!Array.isArray(data)) {
            callback(new Error('Invalid data at path'), null);
            return;
        }

        var addGroupResult = this.createGroup();

        data.forEach(function (doc) {
            self.documents[doc._id] = Document.loadFromObject(doc, addGroupResult());
        });
    }, function finished() {
        callback(null, self);
    }], callback);
};

Collection.prototype._saveToMongo = function(collection, id, callback) {
    var self = this;

    stepdown([function saveAll() {
        var addGroupResult = this.createGroup();

        Object.keys(self.documents).forEach(function (key) {
            self.documents[key]._saveToMongo(collection, key, addGroupResult());
        });
    }, callback], callback);
};

Collection.prototype._loadFromObject = function(object, callback) {
    var self = this;

    stepdown([function loadAll() {
        var addGroupResult = this.createGroup();

        Object.keys(object).forEach(function (key) {
            self.documents[key] = Document.loadFromObject(object[key], addGroupResult());
        });
    }, function finished() {
        callback(null, self);
    }], callback);
};

Collection.prototype.saveToObject = function(object, callback) {
    var self = this;

    stepdown([function saveAll() {
        var addGroupResult = this.createGroup();

        Object.keys(self.documents).forEach(function (key) {
            object[key] = {};
            self.documents[key].saveToObject(object[key], addGroupResult());
        });
    }, function finished() {
        callback(null, self);
    }], callback);
};

Collection.prototype.toObject = function() {
    var self = this;

    return {
        documents: Object.keys(self.documents).map(function (key) {
            return self.documents[key].toObject();
        })
    };
};

Collection.prototype.getContent = function() {
    var self = this;

    return Object.keys(self.documents).map(function (key) {
        return self.documents[key].getContent();
    });
};

module.exports = Collection;
