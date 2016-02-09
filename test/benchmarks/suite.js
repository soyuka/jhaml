'use strict'
const Benchmark = require('benchmark')
const suite = new Benchmark.Suite
const hamlJS = require('./haml-js/lib/haml.js')
const fs = require('fs')

var js = hamlJS.compile(fs.readFileSync(`${__dirname}/page.haml`))

suite.add('Parse#jhaml', function() {
 require('./jhaml.js')
})
.add('Parse#jhamltohtml', function() {
 require('./jhamltohtml.js')
})
.add('Parse#jhamltojavascript', function() {
 require('./jhaml.javascript.js')
})
.add('Parse#haml.js', function() {
 require('./haml.js.js')
})
.add('Parse#haml.js.cached', function() {
 require('./haml.js.cached.js')
})
.add('Parse#haml-js', function() {
 require('./haml-js.js')
})
.add('Parse#haml-js.cached', function() {
 require('./haml-js.cached.js')(js)
})
.on('cycle', function(event) {
  console.log(String(event.target))
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
.run({async: true})
