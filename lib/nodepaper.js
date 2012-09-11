var path = require('path'),
    Theme = require('./theme'),
    Server = require('./server');

function Nodepaper(options) {
    var main = path.dirname(require.main.filename);

    this.theme = this.theme || new Theme(options);
    options.theme = this.theme;
    this.server = this.server || new Server(options);
}

Nodepaper.prototype.startServer = function(callback) {
    this.server.start(callback);
};

Nodepaper.prototype.stopServer = function(callback) {
    this.server.stop(callback);
};

module.exports = Nodepaper;
