'use strict'
const bufferToString = require('../utils.js').bufferToString

/**
 * Attributes parser
 */
function Attributes(opts) {
  if(!(this instanceof Attributes))
    return new Attributes(opts)

  this.start = null
  this.end = null
  this.merge = {}
  this.attributes = ''
  this.interpolated = false  
  this.html = ''
  this.embed = 0
  //Separator for embed attributes
  this.separator = opts.attributes_separator !== undefined ? opts.attributes_separator : '-'
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
 * A kind of recursive json parser
 * this allows attributes to be complex:
 * {ng: {foo: 'bar', bar: {foo: 'bar', bar: 'foo'}}}
 * results in ng_foo: 'bar', ng_bar_foo: 'bar', ng_bar_bar: 'foo'
 * @param {String} data
 * @return {Object}
 */
Attributes.prototype.parseAttributes = function(data) {
  let attrs = {}
  let i = 0
  let length = data.length
  let inQuote = false
  let key = {start: null, end: null}
  let embed = 0
  let hasEmbed = false

  for(let i = 0; i < length; i++) {
    let char = data[i]

    //test for quotes
    if(char === '\'' || char === '"')
      inQuote = !inQuote

    //inside quotes we don't care
    if(inQuote)
      continue

    //key start/end positions
    if(char === '{' && key.start === null) {
      key.start = i + 1 
      continue
    } else if(key.start !== null && char === ':' && key.end === null) {
      key.end = i
      continue
    }

    //Key ends
    if(key.end !== null) {
      //It's an embed attribute
      if(char === '{') {
        embed++
        hasEmbed = true 
      } else if(char === '}') {
        embed--
      }

      if(hasEmbed && embed != -1)
        continue

      //Attribute key/value pair ends
      if(char === '}' || char === ',') {
        let k = data.slice(key.start, key.end)
                .replace(/^,\s?/, '').trim()
        let v = data.slice(key.end + 1, i).trim()

        if(hasEmbed) {
          //recursion
          attrs[k] = this.parseAttributes(v)
        }  else {
          if(attrs[k])
            attrs[k] += v
          else
            attrs[k] = v
        }


        key.start = i + 1
        key.end = null
        continue;
      }
    }
  }

  return attrs
}

/**
 * Transforms a recursive object to proper key/value pairs
 * for example {ng: {click: 'go()'}} will be ng_click: 'go()'
 * @param {Object} attrs
 * @param {String|undefined} key
 */
Attributes.prototype.recurseAttributes = function(attrs, key) {
  let o = {}

  for(let i in attrs) {
    let k = key ? key + this.separator + i : i

    if(typeof attrs[i] === 'object') {
      let a = this.recurseAttributes(attrs[i], k)
      for(let j in a) {
        o[j] = a[j]
      }
    } else {
      o[k] = attrs[i]
    }
  }

  return o
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
    attrs = this.recurseAttributes(this.parseAttributes(this.attributes))
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
    this.html += ` ${i}`

    if(attrs[i] === 'true')
      continue

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
