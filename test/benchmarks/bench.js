'use strict'
const hamlJS = require('./haml-js/lib/haml.js')
const fs = require('fs')

var js = hamlJS.compile(fs.readFileSync(`${__dirname}/page.haml`))

exports.compare = {
  'haml.js': function() {
    require('./haml.js.js')
  },
  'haml.js.cached': function() {
    require('./haml.js.cached.js')
  },
  'haml-js': function() {
    require('./haml-js.js')
  },
  'haml-js-cached': function() {
    require('./haml-js.cached.js')
  },
  'jhaml': function() {
    require('./jhaml.js')
  },
  'jhamltohtml': function() {
    require('./jhamltohtml.js')
  },
  'jhamltojavascript': function() {
    require('./jhaml.javascript.js')
  }
}

require("bench").runMain()

