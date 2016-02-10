'use strict'
let buffer = new Buffer('%div.test#someid{ng: {click: "test"}}!= foo + bar')

const Parser = require('../../lib/Parser.js')
const Javascript = require('../../lib/engines/Javascript.js')

const Benchmark = require('benchmark')
const suite = new Benchmark.Suite
const scope = {foo: 'foo', bar: 'bar'}

const jhaml = new Parser()

suite.add('jhaml (construct + processLine + flush)', function() {
  let parser = new Parser({engine: new Javascript()}, scope)
  parser.processLine(buffer)
  parser._flush(function() {})
})
.add('jhamltohtml (construct + processLine + flush)', function() {
  let parser = new Parser()
  parser.processLine(buffer)
  parser._flush(function() {})
})
.add('jhamltojavascript (construct + processLine + flush)', function(deferred) {
  let parser = new Parser({engine: new Javascript({eval: false})})
  parser.processLine(buffer)
  parser._flush(function() {})
})
.add('jhamltohtml (construct + processLine)', function() {
  let parser = new Parser()
  parser.processLine(buffer)
})
.add('jhamltohtml (processLine)', function() {
  jhaml.processLine(buffer)
})
.on('cycle', function(event) {
  console.log(String(event.target))
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
  console.log('Slowest is ' + this.filter('slowest').map('name'));
})
.run({async: true})
