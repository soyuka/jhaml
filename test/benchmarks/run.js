var fs = require('fs')
var haml = require('./haml.js/lib/haml.js')
var jhaml = require('../index.js')
var page = fs.readFileSync(`${__dirname}/page.haml`)
var stream = require('stream')
// hamlJS = require('./haml-js/lib/haml')

var noop = new stream.Writable({
  write: function(chunk, encoding, next) {
    setImmediate(next)
  }
})

// var js = hamlJS.compile(page)

exports.compare = {
    'haml.js': function(){
      require('./haml.js.js')
    },
    'haml.js cached': function(){
      require('./haml.js.cached.js')
    },
    'jhamltohtml': function() {
      require('./jhamltohtml.js')
    },
    'jhaml': function() {
      require('./jhaml.js')
    },
    /*
     * 'haml-js': function(){
     *     hamlJS.render(page)
     * },
     * 'haml-js cached': function(){
     *     hamlJS.execute(js)
     * },
     * 'haml-js cached / optimized': function(){
     *     hamlJS.execute(js)
     * }
     */
}

require('bench').runMain()
