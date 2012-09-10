var Plates = require('plates');

var HTML_TEMPLATE = '<!doctype html><head></head><body></body>';

function Theme(options) {
}

Theme.prototype.getHead = function() {
    return '<title>A Nodepaper Site</title>';
};

Theme.prototype.getBody = function(collection) {
    var map = Plates.Map();

    map.class('article').to(function (data, value, tagbody) {
        return data;
    });

    // TODO: Sorted by timestamp.
    return Plates.bind('<div class="article"></div>', collection.getContent(), map);
};

Theme.prototype.getHtml = function(content) {
    var map = Plates.Map();

    map.tag('head').to('head');
    map.tag('body').to('body');

    return Plates.bind(HTML_TEMPLATE, content, map);
};

Theme.prototype.getArticleHtml = function(article) {
    return this.getHtml({
        head: this.getHead(),
        body: article.getContent()
    });
};

Theme.prototype.getIndexHtml = function(collection) {
    return this.getHtml({
        head: this.getHead(),
        body: this.getBody(collection)
    });
};

module.exports = Theme;
