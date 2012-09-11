var Plates = require('plates'),
    path = require('path'),
    fs = require('fs');

var HTML_TEMPLATE = '<!doctype html><head></head><body></body>';

function Theme(options) {
    this.themeRoot = this.themeRoot || options.themeRoot || null;
    this.fragments = {
        index: fs.readFileSync(path.join(this.themeRoot, 'index.html')).toString('utf8'),
        article: path.join(this.themeRoot, 'article.html')
    };
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
    return Plates.bind(this.fragments.article, collection.getContent(), map);
};

Theme.prototype.getHtml = function(collection) {
    var map = Plates.Map(),
        submap = Plates.Map();

    console.log('getHtml:', collection);

    submap.class('article').to(function (data, value, tagbody) {
        return data;
    });

    // HACK: Plates expects a path relative to process.cwd.
    map.class('articles').append(path.relative(process.cwd(), this.fragments.article), collection.getContent(), submap);

    return Plates.bind(this.fragments.index, collection, map);
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
