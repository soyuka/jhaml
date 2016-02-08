'use strict'
let Javascript = require('./lib/engines/Javascript.js')
let Parser = require('./lib/Parser.js')

function Jhaml(scope, opts) {
  return new Parser({engine: new Javascript(opts)}, scope)
}

Jhaml.tohtml = function hamlToHtml(scope, opts) {
  return new Parser(opts, scope)
}

module.exports = Jhaml
