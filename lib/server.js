var http = require('http'),
    path = require('path'),
    fs = require('fs'),
    express = require('express'),
    consolidate = require('consolidate'),
    Handlebars = require('handlebars'),
    Article = require('./article'),
    Collection = require('./collection');

function Server(options) {
    if (options == null) {
        options = {};
    }

    this.expressStack = express();
    this.httpServer = http.createServer(this.expressStack);

    this.port = this.port || options.port || 8080;
    this.hostname = this.hostname || options.hostname || null;
    this.contentRoot = this.contentRoot || options.contentRoot || null;
    this.contentRoot = this.contentRoot && this.contentRoot.replace(/\/+$/, '');
    this.theme = this.theme || options.theme || null;
    this.themeRoot = this.themeRoot || options.themeRoot || path.resolve(process.cwd(), 'theme');

    this.expressStack
        // .engine('html', consolidate.handlebars)
        .engine('html', consolidate.dust)
        .set('view engine', 'html')
        .set('views', this.themeRoot)
        .use(express.favicon())
        .use(express.logger())
        .use(express.compress())
        .use(express.bodyParser())
        .use(express.query())
        .use(express.cookieParser())
        .use(express.methodOverride())
        .use(this.expressStack.router);

    if (this.theme) {
        this.expressStack.use(express['static'](this.theme.themeRoot));
    }

    this.expressStack.use(express.errorHandler());

    this.expressStack.get(/^\/$/, this.loadIndex.bind(this));
    this.expressStack.get(/^\/articles(\/[a-z0-9\/-]+)$/, this.loadArticle.bind(this));
        // TODO: Redirect if casing/punctuation is off.
}

Server.prototype.start = function(callback) {
    this.httpServer.listen(this.port, this.hostname, callback);
};

Server.prototype.stop = function(callback) {
    this.httpServer.close(callback);
};

Server.prototype.prepareData = function(collection) {
    collection.themeRoot = this.themeRoot;
    return collection;
};

Server.prototype.loadIndex = function(request, response, callback) {
    var self = this,
        path = self.contentRoot;

    Collection(Article).loadFromPath(path, function (err, collection) {
        if (err) {
            console.error(err.stack || err.message || err);
            callback(err);
            return;
        }

        response.render('index', self.prepareData(collection));
    });
};

Server.prototype.loadArticle = function(request, response, callback) {
    var self = this,
        path = self.contentRoot + request.params[0];

    Article.loadFromPath(path, function (err, article) {
        if (err) {
            callback(err);
            return;
        }

        if (self.theme) {
            response.send(self.theme.render(article));
        } else {
            response.send(JSON.stringify(article));
        }
    });
};

module.exports = Server;
