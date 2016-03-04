'use strict'
const express = require('express')
const app = express()
const jhaml = require('../../')
const fs = require('fs')
const extend = require('util')._extend
const JsPipe = require('@soyuka/jspipe')
const Readable = require('stream').Readable
const hamljs = require('hamljs')
const vm = require('vm')

app.set('views', `${__dirname}`)

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

//borrow some of the View.render code (see express code),
//this is just to get the view.path
function getView(name, options) {
  let renderOptions = {}

  extend(renderOptions, this.locals)
  extend(renderOptions, options._locals)
  extend(renderOptions, options)

  if (renderOptions.cache == null)
    renderOptions.cache = this.enabled('view cache');

  //context here is Application
  const cache = this.cache
  let view

  if (renderOptions.cache) {
    view = cache[name];
  }

  if (!view) {
    var View = this.get('view');

    view = new View(name, {
      defaultEngine: this.get('view engine'),
      root: this.get('views'),
      engines: this.engines
    })

    if (renderOptions.cache) {
      cache[name] = view
    }
  }

  view.renderOptions = renderOptions

  return view
}

/**
 * More complex alternative with js cache and pipes
 */
function jhamlMiddlware(name, options, next, res) {

  if (!options) { options = {} }

  let view = getView.apply(this, [name, options])
  
  let jhamlCache = app.get('jhaml.cache') || {}
  let jhamlJsCache = app.get('jhaml.jscache') || {}

  //no cache pipe and go
  if (!view.renderOptions.cache) {
    console.log('nocache');
    return fs.createReadStream(view.path)
    .pipe(jhaml(view.renderOptions))
    .pipe(res)
  }

  let engine = jhaml(view.renderOptions, {eval: false}) 

  //cached path
  if (jhamlCache[view.path]) {
		if(view.renderOptions.cache === 2) {
      console.log('cache2');
      let sandbox = extend({}, engine.scope)
			let context = new vm.createContext(sandbox)
			jhamlJsCache[view.path].runInContext(context)
      return res.send(sandbox.__html)
    }

    console.log('cache');

    let jsEngine = new JsPipe(engine.scope, {variable: '__html'})

    let stream = new Readable()
    stream._read = function noop() {}
    stream.push(Buffer.concat(jhamlCache[view.path]).toString())
    stream.push(null)

    return stream.pipe(jsEngine).pipe(res)
  }

  let chunks = []

  engine.on('data', function(str) {
    chunks.push(str) 
  })

  engine.on('finish', function() {
    jhamlCache[view.path] = chunks
    jhamlJsCache[view.path] = new vm.Script(Buffer.concat(chunks).toString(), {produceCachedData: true})
    app.set('jhaml.cache', jhamlCache)
    app.set('jhaml.jscache', jhamlJsCache)
  })

  let jsEngine = new JsPipe(engine.scope, {variable: '__html'})

  fs.createReadStream(view.path)
  .pipe(engine)
  .pipe(jsEngine)
  .pipe(res)
}

app.use(function(req, res, next) {
  res.jhaml = function() {
    let args = [].slice.call(arguments)
    args.push(res)
    return jhamlMiddlware.apply(app, args)
  }
  next()
})

app.get('/pipe', function(req, res, next) {
  res.header('Content-Type', 'text/html');
  res.locals.cache = false
  return res.jhaml('all', res.locals, next)
})

app.get('/cached', function(req, res, next) {
  res.header('Content-Type', 'text/html');
  res.locals.cache = true
  return res.jhaml('all', res.locals, next)
})

app.get('/2cached', function(req, res, next) {
  res.header('Content-Type', 'text/html');
  res.locals.cache = 2
  return res.jhaml('all', res.locals, next)
})

let page = app.get('views') + '/all.haml'

app.get('/hamljs', function(req, res, next) {
  res.header('Content-Type', 'text/html');
  res.send(hamljs.render(fs.readFileSync(page), {locals: res.locals}))
})

app.get('/hamljs/cached', function(req, res, next) {
  res.header('Content-Type', 'text/html');
  res.send(hamljs.render(fs.readFileSync(page), {cache: true, filename: 'all.haml', locals: res.locals}))
})

app.listen(3002)
