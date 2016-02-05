'use strict'
const bufferToString = require('./utils.js').bufferToString
const util = require('util')

const attributesRegex = new RegExp(/^(.*?): ?(.+)$/)

function Attributes(scope) {
  if(!(this instanceof Attributes))
    return new Attributes(scope)

  this.start = null
  this.end = null
  this.merge = {}
  this.attributes = ''
  this.scope = scope
  this.interpolated = false  
  this.html = ''
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

  return this.toHtml()
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

  let attrs = {}

  if(this.attributes) {
    this.attributes
      .substring(1, this.attributes.length - 1)
      .split(/, ?/g)
      .map(e => {
        let matches = attributesRegex.exec(e)

        if(!matches)
          throw new TypeError('Arguments malformed: ' + this.attributes)

        attrs[matches[1]] = matches[2]
      })
  }


  for(let i in this.merge) {
    if(i in attrs && typeof attrs[i] === 'string' && (attrs[i][0] == '"' || attrs[i][0] == "'")) {
      attrs[i] = attrs[i][0] + this.merge[i] + ' ' + attrs[i].substring(1, attrs[i].length)
    } else {
      attrs[i] = `"${this.merge[i]}"`
    }
  }

  this.html = ''

  for(let i in attrs) {
    if(attrs[i].replace(/"|'/g, '').length === 0)
      continue

    this.html += ` ${i}`

    if(attrs[i][0] === "'" || attrs[i][0] === '"') {
      this.html += `=${attrs[i]}`
    } else {
      if(!this.interpolated)
        this.interpolated = true
      this.html += '="${'+attrs[i]+'}"'
    }
  }

  return this
}

/*
 * Attributes.prototype.toHtml = function() {
 *   if(!this.has())
 *     return ''
 * 
 *   let attrs = this.attributes || '{}'
 *   let merge = JSON.stringify(this.merge)
 *   
 *   let sandbox = util._extend({}, this.scope)
 * 
 *   vm.runInNewContext(`
 *     'use strict';
 *     const __attributes = ${attrs}; 
 *     const __merge = ${merge}; 
 *     for(let m in __merge) {
 *       if(!__merge[m])
 *         continue;
 * 
 *       if(m in __attributes && typeof __attributes[m] === 'string') {
 *         __attributes[m] += __merge[m];
 *       } else {
 *         __attributes[m] = __merge[m];
 *       }
 *     }
 * 
 *     var __html = '';
 *     for(let i in __attributes) {
 *       __html += ' ' + i + '="' + (__attributes[i] === true ? i : __attributes[i]) + '"';
 *     }
 *   `, sandbox)
 * 
 *    return sandbox.__html
 * }
 */

module.exports = Attributes
