'use strict'
const bufferToString = require('../utils.js').bufferToString

const attributesRegex = new RegExp(/^(.*?): ?(.+)$/)

/**
 * Attributes parser
 */
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

/**
 * Have we found the start position ?
 * @return {Boolean}
 */
Attributes.prototype.started = function() {
  return this.start !== null
}

/**
 * Have we reached the end position ?
 * @return {Boolean}
 */
Attributes.prototype.ended = function() {
  return this.start !== null && this.end !== null
}

/**
 * Parse transforms the chunk in a string 
 * except code see cssParser
 * @return {this}
 */
Attributes.prototype.parse = function(chunk) {
  if(!chunk)
    return this.toHtml()

  chunk = bufferToString(chunk, this.start, this.end)

  this.attributes = chunk

  return this.toHtml()
}

/**
 * Has attributes?
 * @return {Boolean}
 */
Attributes.prototype.has = function() {
  let l = Object.keys(this.merge).filter(e => this.merge[e] !== '').length
  return (this.attributes.length + l) > 0
}

/**
 * Adds attributes that will be merged
 * @param {Object} o
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

/**
 * Transforms attributes to html
 * @return {this}
 */
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
          throw new SyntaxError('Arguments malformed: ' + this.attributes)

        attrs[matches[1]] = matches[2]
      })
  }

  for(let i in this.merge) {
    if(!this.merge[i])
      continue

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

module.exports = Attributes
