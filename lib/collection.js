var path = require('path'),
    fs = require('fs'),
    url = require('url'),
    util = require('util'),
    mongodb = require('mongodb'),
    stepdown = require('stepdown'),
    Article = require('./article'),
    Document = require('./document');

function Collection() {
    Document.call(this);

    // TODO: Make a Collection of any Document type.
    this.articles = {};
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

            Article.loadFromDisk(filepath, function (err, article) {
                if (err) {
                    if (err.code === 'EISDIR') {
                        callback(null, null);
                        return;
                    }

                    callback(err, null);
                    return;
                }

                self.articles[filename] = article;
                callback(null, article);
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

        Object.keys(self.articles).forEach(function (key) {
            self.articles[key].saveToDisk(path.join(resolvedPath, key), addGroupResult());
        });
    }, function finished(results) {
        callback(null, self);
    }], callback);
};

Collection.prototype._loadFromMongo = function(collection, id, callback) {
    var self = this;

    stepdown([function loadCollection() {
        if (id) {
            Article.prototype._loadFromMongo.call(collection, id, this.next);
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
            self.articles[doc._id] = Article.loadFromObject(doc, addGroupResult());
        });
    }, function finished() {
        callback(null, self);
    }], callback);
};

Collection.prototype._saveToMongo = function(collection, id, callback) {
    var self = this;

    stepdown([function saveAll() {
        var addGroupResult = this.createGroup();

        Object.keys(self.articles).forEach(function (key) {
            self.articles[key]._saveToMongo(collection, key, addGroupResult());
        });
    }, callback], callback);
};

Collection.prototype._loadFromObject = function(object, callback) {
    var self = this;

    stepdown([function loadAll() {
        var addGroupResult = this.createGroup();

        Object.keys(object).forEach(function (key) {
            self.articles[key] = Article.loadFromObject(object[key], addGroupResult());
        });
    }, function finished() {
        callback(null, self);
    }], callback);
};

Collection.prototype.saveToObject = function(object, callback) {
    var self = this;

    stepdown([function saveAll() {
        var addGroupResult = this.createGroup();

        Object.keys(self.articles).forEach(function (key) {
            object[key] = {};
            self.articles[key].saveToObject(object[key], addGroupResult());
        });
    }, function finished() {
        callback(null, self);
    }], callback);
};

Collection.prototype.toObject = function() {
    var self = this;

    return {
        articles: Object.keys(self.articles).map(function (key) {
            return self.articles[key].toObject();
        })
    };
};

Collection.prototype.getContent = function() {
    var self = this;

    return Object.keys(self.articles).map(function (key) {
        return self.articles[key].getContent();
    });
};

module.exports = Collection;
