var http = require('http'),
    path = require('path'),
    fs = require('fs'),
    express = require('express'),
    dust = require('dustjs-linkedin'),
    stepdown = require('stepdown'),
    watch = require('watch');

function Server(options) {
    if (options == null) {
        options = {};
    }

    this.expressStack = express();
    this.httpServer = http.createServer(this.expressStack);

    this.port = this.port || options.http.port || 8080;
    this.hostname = this.hostname || options.http.hostname || null;
    this.paths = this.paths || options.paths;

    this.expressStack
        .use(express.favicon())
        .use(express.logger())
        .use(express.compress())
        .use(express.bodyParser())
        .use(express.query())
        .use(express.cookieParser())
        .use(express.methodOverride())
        .use(this.expressStack.router);

    this.expressStack.use(express['static'](this.paths.theme));
    this.staticPos = this.expressStack.stack.length - 1;

    this.expressStack.use(express.errorHandler());

    this.expressStack.get(/^\/$/, this.loadIndex.bind(this));
    this.expressStack.get(/^\/articles(\/[a-z0-9\/-]+)$/, this.loadArticle.bind(this));
    // TODO: Redirect if casing/punctuation is off.

    this.baseContext = dust.makeBase({
        // TODO: Title generator
        // TODO: Load Partials
        // TODO: Load metadata
        // TODO: Load author
        // TODO: Load article?
    });
}

Server.prototype.loadTheme = function(dirpath, callback) {
    if (typeof dirpath === 'function') {
        callback = dirpath;
        dirpath = this.paths.theme;
    }

    var self = this;

    stepdown([function readFiles() {
        self.expressStack.stack[self.staticPos].handle = express['static'](dirpath);

        // TODO: Watch and re-load theme on change.
        // TODO: Starting templates: 404 (and other codes), index, article (or 'single'), author.
        fs.readFile(path.join(dirpath, 'index.html'), this.addResult());
        fs.readFile(path.join(dirpath, 'head.html'), this.addResult());
        fs.readFile(path.join(dirpath, 'navbar.html'), this.addResult());
        fs.readFile(path.join(dirpath, 'article.html'), this.addResult());
    }, function compile(index, head, navbar, article) {
        dust.loadSource(dust.compile(index.toString('utf8'), 'index'));
        dust.loadSource(dust.compile(head.toString('utf8'), 'head'));
        dust.loadSource(dust.compile(navbar.toString('utf8'), 'navbar'));
        dust.loadSource(dust.compile(article.toString('utf8'), 'article'));

        return this;
    }], callback);
};

Server.prototype.start = function(callback) {
    var self = this;

    stepdown([function preload() {
        self.loadTheme(this.next);
    }, function startServer() {
        self.httpServer.listen(self.port, self.hostname, this.next);
    }], callback);
};

Server.prototype.stop = function(callback) {
    this.httpServer.close(callback);
};

Server.prototype.loadIndex = function(request, response, callback) {
    var self = this;

    stepdown([function loadContentDir() {
        fs.readdir(self.paths.content, this.next);
    }, function loadContentFiles(filenames) {
        var addFileResult = this.createGroup();

        filenames.forEach(function (filename) {
            filename = path.join(self.paths.content, filename);

            fs.readFile(filename, addFileResult());
        });
    }, function parseContents(files) {
        return files.map(function (file) {
            return file.toString('utf8');
        }).map(JSON.parse);
        // Collection(Article).loadFromPath(path.join(process.cwd(), 'articles'), this.addResult());
        // // HACK Hardcoded
        // Collection(Author).loadFromPath(path.join(process.cwd(), 'authors'), this.addResult());
    }, function render(articles/*, authors*/) {
        dust.render('index', self.baseContext.push({
            page: articles
            // page: articles.documents,
            // authors: authors.documents
        }), this.next);
    }, function finished(content) {
        return content;
    }]).on('error', callback).on('complete', response.send.bind(response));
};

Server.prototype.loadArticle = function(request, response, callback) {
    var self = this,
        path = self.paths.content + request.params[0];

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
