var Document = require('./document'),
    marked = require('marked');

function Article() {
    if (!(this instanceof Article)) {
        return new Article();
    }

    Document.call(this);

    this.type = 'text';
    this.authors = null;
    this.content = null;
    this.createdAt = null;
}
Document.extend(Article);

Article.prototype._loadFromObject = function(object, callback) {
    this.type = object.type;
    this.authors = object.authors;
    this.content = object.content;
    this.createdAt = object.createdAt;

    Document.prototype._loadFromObject.call(this, object, callback);
};

Article.prototype._saveToObject = function(object, callback) {
    object.type = this.type;
    object.authors = this.authors;
    object.content = this.content;
    object.createdAt = this.createdAt;

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
