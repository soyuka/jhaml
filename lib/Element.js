'use strict'
const Attributes = require('./Attributes.js')
const bufferToString = require('./utils.js').bufferToString

const selfClosing = [
  'meta', 'img', 'link', 'br', 'hr', 'input', 'area', 'base' 
]

function Element(scope) {
  if(!(this instanceof Element))
    return new Element(scope)

  this.start = null
  this.end = null
  this.attributes = null
  this.element = null
  this.closer = null
  this.opened = false
  this.closed = false
  this.scope = scope
  this.content = false
}

Element.prototype.started = function() {
  return this.start !== null
}

Element.prototype.ended = function() {
  return this.start !== null && this.end !== null
}

//@TODO match = or !=
Element.prototype.parse = function(chunk) {
  chunk = bufferToString(chunk, this.start, this.end)

  return this.cssParser(chunk)
}

Element.prototype.cssParser = function(chunk) {
  let reg = new RegExp('([#|\.|%][a-z0-9-_]+)', 'gi')
  let match = reg.exec(chunk)
  let attributes = {class: '', id: ''}

  while(match !== null) {
    let c = match[0].charAt(0)
    if(c === '%') {
      this.element = match[0].replace(c, '')
    } else if(c === '#') {
     attributes.id = match[0].replace(c, '')
    } else {
     attributes.class += match[0].replace(c, attributes.class === '' ? '' : ' ')
    }

    match = reg.exec(chunk)
  }

  this.attributes.add(attributes)

  if(this.attributes.has() && this.element === null)
    this.element = 'div'

  return this
}

Element.prototype.selfClosing = function() {
  return ~selfClosing.indexOf(this.element) ? ' /' : ''
}

Element.prototype.open = function() {
  this.opened = true

  this.closed = !!this.selfClosing()

  if(this.element === null)
    return ''

  if(this.closer !== null)
    return this.element

  return `<${this.element}${this.attributes.toHtml()}${this.selfClosing()}>`
}

Element.prototype.close = function() {
  this.closed = true

  if(this.element === null)
    return ''

  if(this.closer !== null)
    return this.closer

  return `</${this.element}>`
}

module.exports = Element
