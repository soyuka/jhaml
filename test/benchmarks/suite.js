'use strict'
const Benchmark = require('benchmark')
const suite = new Benchmark.Suite

suite.add('Parse#jhaml', function() {
 require('./jhaml.js')
})
.add('Parse#jhamltohtml', function() {
 require('./jhamltohtml.js')
})
.add('Parse#haml.js', function() {
 require('./haml.js.js')
})
.add('Parse#haml.js', function() {
 require('./haml.js.cached.js')
})
.on('cycle', function(event) {
  console.log(String(event.target))
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
.run({async: true})
