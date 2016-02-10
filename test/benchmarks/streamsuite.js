'use strict'
const Benchmark = require('benchmark')
const fs = require('fs')
const suite = new Benchmark.Suite

suite.add('jhaml', function(deferred) {
  const jhaml = require('../../')()
  let stream = fs.createReadStream(`${__dirname}/page.haml`)

  jhaml.on('finish', function() {
   deferred.resolve() 
  })

  stream.pipe(jhaml)
}, {defer: true})
.add('jhamltohtml', function(deferred) {
  let stream = fs.createReadStream(`${__dirname}/page.haml`)
  const jhamltohtml = require('../../').tohtml()

  jhamltohtml.on('finish', function() {
   deferred.resolve() 
  })

  stream.pipe(jhamltohtml)
}, {defer: true})
.add('jhamltojavascript', function(deferred) {
  let stream = fs.createReadStream(`${__dirname}/page.haml`)
  const jhamltojavascript = require('../../')({}, {eval: false})

  jhamltojavascript.on('finish', function() {
   deferred.resolve() 
  })

  stream.pipe(jhamltojavascript)
}, {defer: true})
.on('cycle', function(event) {
  console.log(String(event.target))
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
  console.log('Slowest is ' + this.filter('slowest').map('name'));
})
.run({async: true})
