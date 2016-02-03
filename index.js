'use strict'
let Javascript = require('./lib/engines/Javascript.js')
let Parser = require('./lib/Parser.js')

function Jhaml(scope) {
  return new Parser({engine: new Javascript()}, scope)
}

Jhaml.tohtml = function hamlToHtml(scope) {
  return new Parser({}, scope)
}

module.exports = Jhaml
