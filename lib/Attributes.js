'use strict'
const vm = require('vm')
const bufferToString = require('./utils.js').bufferToString
const util = require('util')

function Attributes(scope) {
  if(!(this instanceof Attributes))
    return new Attributes(scope)

  this.start = null
  this.end = null
  this.merge = {}
  this.attributes = ''
  this.scope = scope
}

Attributes.prototype.started = function() {
  return this.start !== null
}

Attributes.prototype.ended = function() {
  return this.start !== null && this.end !== null
}

Attributes.prototype.parse = function(chunk) {
  chunk = bufferToString(chunk, this.start, this.end)

  this.attributes = chunk

  return this
}

Attributes.prototype.has = function() {
  let l = Object.keys(this.merge).filter(e => this.merge[e] !== '').length
  return (this.attributes.length + l) > 0
}

/**
 * Adds attributes that will be merged
 * @params {Object} o
 */
Attributes.prototype.add = function(o) {
  for(let i in o) {
    if(this.merge[i]) 
      this.merge[i] += o[i]
    else
      this.merge[i] = o[i]
  }

  return this
}

Attributes.prototype.toHtml = function() {
  if(!this.has())
    return ''

  let attrs = this.attributes || '{}'
  let merge = JSON.stringify(this.merge)
  
  let sandbox = util._extend({}, this.scope)

  vm.runInNewContext(`
    'use strict';
    const __attributes = ${attrs}; 
    const __merge = ${merge}; 
    for(let m in __merge) {
      if(!__merge[m])
        continue;

      if(m in __attributes && typeof __attributes[m] === 'string') {
        __attributes[m] += __merge[m];
      } else {
        __attributes[m] = __merge[m];
      }
    }

    var __html = '';
    for(let i in __attributes) {
      __html += ' ' + i + '="' + (__attributes[i] === true ? i : __attributes[i]) + '"';
    }
  `, sandbox)

   return sandbox.__html
}

module.exports = Attributes
