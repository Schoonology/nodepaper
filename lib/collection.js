var path = require('path'),
    fs = require('fs'),
    url = require('url'),
    util = require('util'),
    mongodb = require('mongodb'),
    stepdown = require('stepdown'),
    Article = require('./article');

function Collection() {
    this.path = null;
    this.articles = {};
}
util.inherits(Collection, Article);

Collection.loadFromPath = function (path, callback) {
    var a = new Collection();
    return a.loadFromPath(path, callback);
};

Collection.loadFromDisk = function (filepath, callback) {
    var a = new Collection();
    return a.loadFromDisk(filepath, callback);
};

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

Collection.loadFromMongo = function (path, callback) {
    var a = new Collection();
    return a.loadFromMongo(path, callback);
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

Collection.loadFromObject = function (object, callback) {
    var a = new Collection();
    return a.loadFromObject(object, callback);
};

Collection.prototype.loadFromObject = function(object, callback) {
    if (object == null) {
        callback(new Error('Invalid value'), null);
        return;
    }

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
    if (object == null) {
        callback(new Error('Invalid value'), null);
        return;
    }

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

Collection.prototype.toJSON = function() {
    return this.toObject();
};

Collection.prototype.getContent = function() {
    var self = this;

    return Object.keys(self.articles).map(function (key) {
        return self.articles[key].getContent();
    });
};

module.exports = Collection;
