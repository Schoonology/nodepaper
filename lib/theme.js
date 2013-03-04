//
// # Theme
//
// Responsible for loading and rendering the configured Dust theme.
//
var fs = require('fs')
  , path = require('path')
  , debug = require('debug')('nodepaper:theme')
  , dust = require('dustjs-linkedin')
  , nodefn = require('when/node/function')
  , when = require('when')
  , THEME_INDEX = 'index.html'

//
// ## Dust helpers
//
// Nodepaper supports the @sep and @idx helpers described [here](http://akdubya.github.com/dustjs/#syntax).
//
dust.helpers = {
  sep: function(chunk, context, bodies) {
    if (context.stack.index === context.stack.of - 1) {
      return chunk;
    }
    return bodies.block(chunk, context);
  },
  idx: function(chunk, context, bodies) {
    return bodies.block(chunk, context.push(context.stack.index));
  }
}

//
// ## Theme `Theme(obj)`
//
// Creates a new instance of Theme with the following options:
//
//  * `themedir` - The directory containing a Dust template named index.html suitable for rendering.
//
function Theme(obj) {
  if (!(this instanceof Theme)) {
    return new Theme(obj)
  }

  obj = obj || {}

  this.themedir = obj.themedir

  this._theme = null
}
Theme.createTheme = Theme

//
// ## start `start()`
//
// Returns a promise to be fulfilled when all internal dependencies are ready and `render` calls can be made.
//
Theme.prototype.start = start
function start() {
  var self = this

  return nodefn.call(fs.readFile, path.join(self.themedir, THEME_INDEX))
    .then(function (buffer) {
      self._theme = dust.compileFn(String(buffer))

      return self
    })
}

//
// ## render `render(data)`
//
// Returns a promise to be fulfilled with the rendered HTML from the loaded theme and **data**.
//
Theme.prototype.render = render
function render(data) {
  var self = this

  return nodefn.call(self._theme, data)
}

module.exports = Theme
