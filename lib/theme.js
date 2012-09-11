var Plates = require('plates'),
    path = require('path'),
    fs = require('fs');

function Theme(options) {
    this.themeRoot = this.themeRoot || options.themeRoot || null;
    this.fragments = {
        // TODO: Get away from *Sync?
        index: fs.readFileSync(path.join(this.themeRoot, 'index.html')).toString('utf8'),
        article: fs.readFileSync(path.join(this.themeRoot, 'article.html')).toString('utf8')
    };

    // Pre-compile where possible.
    this.articleMap = Plates.Map();
    this.articleMap.className('article').to(function (data, value, tagbody) {
        return data;
    });
}

Theme.prototype.render = function(collection, callback) {
    var indexMap = Plates.Map(),
        articles = collection.getContent();

    if (!Array.isArray(articles)) {
        articles = [articles];
    }

    indexMap.className('articles').append(this.fragments.article, articles, this.articleMap);

    callback(null, Plates.bind(this.fragments.index, collection, indexMap));
};

module.exports = Theme;
