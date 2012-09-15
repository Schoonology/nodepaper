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
    this.authorMap = Plates.Map();
    this.authorMap.className('author').to(function (data, value, tagbody) {
        return data;
    });
}

Theme.prototype.render = function(articleOrCollection, callback) {
    var indexMap = Plates.Map(),
        content = articleOrCollection.getContent();

    if (!Array.isArray(content)) {
        content = [content];
    }

    indexMap.className('articles').append(this.fragments.article, content, this.articleMap);

    return Plates.bind(this.fragments.index, articleOrCollection, indexMap);
};

module.exports = Theme;
