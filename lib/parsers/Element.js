'use strict'
const Attributes = require('./Attributes.js')
const bufferToString = require('../utils.js').bufferToString

const selfClosing = [
  'meta', 'img', 'link', 'br', 'hr', 'input', 'area', 'base' 
]

const cssRegExp = new RegExp('([#|\.|%][^#|\.|%]*)', 'gi')

/**
 * Element parser
 */
function Element() {
  if(!(this instanceof Element))
    return new Element()

  //start position
  this.start = null
  //end position
  this.end = null
  //Attributes instance
  this.attributes = null

  //is the element open yet
  this.opened = false
  //is the element cloed yet
  this.closed = false
  //is there a following content on the same line? %p stuff 
  this.content = false
  this.contentOnly = false
  //is this code?
  this.code = false
  //should it be htmlencoded 
  this.encode = false
  //should it be interpolated
  this.interpolate = false
  //force auto close (ex DOCTYPE)
  this.selfClose = false
  //skip element
  this.skip = false
  //white space removal
  this.whitespaceremoval = {before: false, after: false}

  //prefix and suffix for open/close state
  this.prefix = {open: '<', close: '</'}
  this.suffix = {open: '>', close: '>'}

  //tags
  this.tag = {open: null, close: null}
}

/**
 * Have we found the start position ?
 * @return {Boolean}
 */
Element.prototype.started = function() {
  return this.start !== null
}

/**
 * Have we reached the end position ?
 * @return {Boolean}
 */
Element.prototype.ended = function() {
  return this.start !== null && this.end !== null
}

/**
 * Parse transforms the chunk in a string 
 * except code see cssParser
 * @return {this}
 */
Element.prototype.parse = function(chunk) {
  chunk = bufferToString(chunk, this.start, this.end)

  if(this.code) {
    this.tag.open = chunk
    return this
  }

  return this.cssParser(chunk)
}

/**
 * Parses the element string, adds class/id attributes
 * %ul#test.foo.bar => <ul class="foo bar" id="test">
 * @return {this}
 */
Element.prototype.cssParser = function(chunk) {
  let match = cssRegExp.exec(chunk)
  let attributes = {class: '', id: ''}

  while(match !== null) {
    let c = match[0].charAt(0)
    if(c === '%') {
      this.tag.open = match[0].replace(c, '')
    } else if(c === '#') {
     attributes.id = match[0].replace(c, '')
    } else {
     attributes.class += match[0].replace(c, attributes.class === '' ? '' : ' ')
    }

    match = cssRegExp.exec(chunk)
  }

  this.attributes.add(attributes)

  if(this.attributes.has() && this.tag.open === null)
    this.tag.open = 'div'

  this.tag.close = this.tag.open

  return this
}

/**
 * Checks if self closing on known elements
 * @return {String}
 */
Element.prototype.selfClosing = function() {
  return ~selfClosing.indexOf(this.tag.open) ? ' /' : ''
}

/**
 * Opens an element
 * @return {String} <open >
 */
Element.prototype.open = function() {
  this.opened = true

  this.closed = this.selfClose || !!this.selfClosing()

  if(this.tag.open === null)
    return ''

  return `${this.prefix.open}${this.tag.open}${this.attributes.html}${this.selfClosing()}${this.suffix.open}`
}

/**
 * Closes an element
 * @return {String} </close>
 */
Element.prototype.close = function() {
  this.closed = true

  if(this.tag.close === null)
    return ''

  return `${this.prefix.close}${this.tag.close}${this.suffix.close}`
}

module.exports = Element
