var Document = require('./document'),
    util = require('util'),
    path = require('path'),
    fs = require('fs'),
    url = require('url'),
    marked = require('marked'),
    mongodb = require('mongodb'),
    stepdown = require('stepdown');

function Article() {
    if (!(this instanceof Article)) {
        return new Article();
    }

    Document.call(this);

    this.type = 'text';
    this.content = null;
}
Document.extend(Article);

Article.prototype._loadFromObject = function(object, callback) {
    this.type = object.type;
    this.content = object.content;

    Document.prototype._loadFromObject.call(this, object, callback);
};

Article.prototype._saveToObject = function(object, callback) {
    object.type = this.type;
    object.content = this.content;

    Document.prototype._loadFromObject.call(this, object, callback);
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
