'use strict'
const express = require('express')
const app = express()
const jhaml = require('../')
const fs = require('fs')

app.set('views', `${__dirname}/fixtures/jhaml/eval`)

app.engine('.haml', function(str, options, fn) {
  let engine = jhaml(options)
  fs.createReadStream(str)
  .pipe(engine)
  
  let chunks = []
  engine.on('data', function(str) {
    chunks.push(str)
  })

  engine.on('error', function(err) {
    fn(err)
  })

  engine.on('end', function() {
    fn(null, Buffer.concat(chunks).toString())
  })
})

app.set('view engine', 'haml')

app.use(function(req, res, next) {
  res.locals = {
    disabled: true, 
    select: [{value: 0, text: 'Zero'}, {value: 1, text: 'One'}],
    interpolated: 'Test',
    test: '&<>',
    message: 'it works!',
    stuff: 'just fine!',
    method: function(foo) { return 'bar'; }
  }
  next()
})

app.get('/', function(req, res, next) {
 return res.render('all', res.locals)
})

app.get('/test2', function(req, res, next) {

  let engine = jhaml(res.locals) 

  fs.createReadStream(app.get('views') + '/all.haml')
  .pipe(engine)
  .pipe(res)
})

app.listen(3002)
