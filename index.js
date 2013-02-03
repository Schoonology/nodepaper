if (require.main === module) {
  require('./bin/nodepaper')
}

// var Document = require('./lib/document'),
//     Article = require('./lib/article'),
//     Author = require('./lib/author'),
//     Collection = require('./lib/collection'),
//     Server = require('./lib/server');

// if (require.main === module) {
//     var stepdown = require('stepdown'),
//         path = require('path');

//     stepdown([function createServer() {
//         return new Server({
//             http: {
//                 hostname: 'localhost',
//                 port: 8080
//             },
//             paths: {
//                 theme: path.join(process.cwd(), 'theme'),
//                 content: path.join(process.cwd(), 'content')
//             }
//         });
//     }, function startServer(server) {
//         server.start(this.next);
//     }])
//         .on('error', function errorHandler(err) {
//             console.error(err.stack || err.message || err);
//         })
//         .on('complete', function complete() {
//             console.log('Server listening at localhost:8080.');
//             console.log('Theme:', path.join(process.cwd(), 'theme'));
//             console.log('Content:', path.join(process.cwd(), 'content'));
//         });
// } else {
//     module.exports = {
//         Document: Document,
//         Article: Article,
//         Author: Author,
//         Collection: Collection,
//         Server: Server
//     };
// }
