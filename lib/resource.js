var fs = require('fs')
  , path = require('path')
  , util = require('util')
  , $$ = require('stepdown')

//
// # Resource
//
function Resource(obj) {
  if (!(this instanceof Resource)) {
    return new Resource(obj)
  }

  this.meta = obj.meta
  this.content = obj.content
}
Resource.createResource = Resource
Resource.ext = 'html'
Resource.root = ''

//
// ## extend `Resource.extend(Class)`
//
// Extends **Class** both prototypically and statically with all of the methods and properties of `Resource`.
//
Resource.extend = function (Class) {
  var cls = this

  util.inherits(Class, cls)

  Object.keys(cls).forEach(function (key) {
    Class[key] = cls[key]
  })
}

//
// ## load `Resource.load(options, callback)`
//
// Loads the resource at **options.path**, filling in both JSON and **options.ext**(default: HTML) contents.
//
Resource.load = load
function load(options, callback) {
  var cls = this
    , name = options.name || 'index'
    , root = options.root || cls.root
    , ext = options.ext || 'html'

  $$([
    function ($) {
      fs.exists(path.join(root, name + '.json'), $.event())
      fs.exists(path.join(root, name + '.' + ext), $.event())
    },
    function ($, a, b) {
      if (!a) {
        $.end(null, null)
        return
      }

      fs.readFile(path.join(root, name + '.json'), 'utf8', $.first())

      if (b) {
        fs.readFile(path.join(root, name + '.' + ext), 'utf8', $.first())
      }
    },
    function ($, meta, content) {
      return new cls({
        meta: JSON.parse(meta),
        content: content || ''
      })
    }
  ], callback)
}

//
// ## save `Resource.save(options, callback)`
//
// Saves **options.content** and **options.meta** (or the combined **options.body**) to **options.path**.
//
Resource.save = save
function save(options, callback) {
  var cls = this
    , name = options.name || 'index'
    , root = options.root || cls.root
    , body = options.body || {}
    , meta = options.meta || body.meta || {}
    , content = options.content || body.content || ''
    , ext = options.ext || 'html'

  console.log('Saving:', meta, content)

  $$([
    function ($) {
      fs.writeFile(path.join(root, name + '.json'), JSON.stringify(meta, null, 2), $.first())
      fs.writeFile(path.join(root, name + '.' + ext), content, $.first())
    },
    function ($) {
      return {
        meta: meta,
        content: content
      }
    }
  ], callback)
}

//
// ## remove `Resource.remove(options, callback)`
//
// Deletes the resource at **options.path**.
//
Resource.remove = remove
function remove(options, callback) {
  var cls = this
    , name = options.name || 'index'
    , root = options.root || cls.root
    , ext = options.ext || 'html'

  console.log('Removing:', name)

  $$([
    function ($) {
      fs.unlink(path.join(root, name + '.json'), $.first())
      fs.unlink(path.join(root, name + '.' + ext), $.first())
    },
    function ($) {
      // TODO: Serve the removed resource?
      return {}
    }
  ], callback)
}

//
// ## find `Resource.find(options, callback)`
//
// Finds all the available resources, responding with a list of names.
//
Resource.find = find
function find(options, callback) {
  var cls = this
    , root = options.root || cls.root

  $$([
    function ($) {
      fs.readdir(root, $.first())
    },
    function ($, children) {
      var generator = $.group()

      children.forEach(function (child) {
        var abs = path.resolve(root, child)
          , ext = path.extname(abs)
          , cb

        if (ext === '.json') {
          cb = generator()

          fs.lstat(abs, function (err, stat) {
            cb(err, {
              abs: child,
              stat: stat
            })
          })
        }
      })
    },
    function ($, results) {
      return results.filter(function (obj) {
        return obj.stat.isFile()
      }).map(function (obj) {
        return path.join(path.dirname(obj.abs), path.basename(obj.abs, '.json'))
      })
    }
  ], callback)
}

module.exports = Resource
