var Document = require('./document'),
    marked = require('marked');

function Author() {
    if (!(this instanceof Author)) {
        return new Author();
    }

    Document.call(this);

    this.name = null;
    this.nickname = null;
    this.description = null;
    this.url = null;
    this.email = null;
}
Document.extend(Author);

Author.prototype._loadFromObject = function(object, callback) {
    this.name = object.name;
    this.nickname = object.nickname;
    this.description = object.description;
    this.url = object.url;
    this.email = object.email;

    Document.prototype._loadFromObject.call(this, object, callback);
};

Author.prototype._saveToObject = function(object, callback) {
    object.name = this.name;
    object.nickname = this.nickname;
    object.description = this.description;
    object.url = this.url;
    object.email = this.email;

    Document.prototype._loadFromObject.call(this, object, callback);
};

module.exports = Author;
