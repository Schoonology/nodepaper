var http = require('http'),
    express = require('express'),
    Article = require('./article'),
    Collection = require('./collection'),
    Theme = require('./theme');

function Server(options) {
    if (options == null) {
        options = {};
    }

    this.expressStack = express();
    this.httpServer = http.createServer(this.expressStack);

    this.port = this.port || options.port || 8080;
    this.hostname = this.hostname || options.hostname || null;
    this.articleRoot = this.articleRoot || options.articleRoot || null;
    this.articleRoot = this.articleRoot && this.articleRoot.replace(/\/+$/, '');

    this.expressStack
        .use(express.favicon())
        .use(express.logger())
        .use(express.compress())
        .use(express.bodyParser())
        .use(express.query())
        .use(express.cookieParser())
        .use(express.methodOverride())
        .use(this.expressStack.router)
        .use(express.errorHandler());

    this.expressStack.get(/^\/$/, this.loadIndex.bind(this));
    this.expressStack.get(/^\/articles(\/[a-z0-9\/-]+)$/, this.loadArticle.bind(this));
        // TODO: Redirect if casing/punctuation is off.

    this.theme = new Theme();
}

Server.prototype.start = function(callback) {
    this.httpServer.listen(this.port, this.hostname, callback);
};

Server.prototype.stop = function(callback) {
    this.httpServer.close(callback);
};

Server.prototype.loadIndex = function(request, response, callback) {
    var self = this,
        path = self.articleRoot;

    Collection.loadFromPath(path, function (err, collection) {
        if (err) {
            console.error(err.stack || err.message || err);
            callback(err);
            return;
        }

        response.send(self.theme.getIndexHtml(collection));
    });
};

Server.prototype.loadArticle = function(request, response, callback) {
    var self = this,
        path = self.articleRoot + request.params[0];

    Article.loadFromPath(path, function (err, article) {
        if (err) {
            callback(err);
            return;
        }

        response.send(self.theme.getArticleHtml(article));
    });
};

module.exports = Server;
