'use strict'
const utils = require('./utils')

function Haml() {
  if(!(this instanceof Haml))
    return new Haml()

  utils.toCharBufferMap(utils.CHAR_MAP, this)

  this.handled = false
  this.skip_indent = null
}

Haml.prototype.skip = function(indent) {
  if(this.skip_indent !== null) {
    if(indent > this.skip_indent) {
      return true
    } 

    if(indent <= this.skip_indent) {
      this.skip_indent = null 
    }
  }

  return false
}

/**
 * @param {Buffer} chunk
 */
Haml.prototype.handle = function(chunk, i, element, attributes, indent) {
  let content = null

  if(chunk[i - 1] === this.escape) {
    element.start = 0
    element.closed = true
    content = i 
    this.handled = true
    return content
  }

  let array = [chunk[i - 1], chunk[i]]

  if(this.skip(indent) || utils.equalsBuffer(array, this.comment)) {
    element.closed = true

    if(this.skip_indent === null)
      this.skip_indent = indent

    this.handled = true
    return content
  }

  if(utils.equalsBuffer(array, this.conditionalComment.start)) {

    for(let j = i + 1; j < chunk.length; j++) {
      if(chunk[j] === this.conditionalComment.end) {
        content = j 
        break;
      }
    }

    if(content === null)
      throw new SyntaxError('Conditionnal comment is not closed')

    element.element = '<!--'+chunk.slice(i, content + 1)+'>'
    element.closer = '<![endif]-->'
    content = content + 1

    this.handled = true
    return content
  }

  if(chunk[i - 1] === this.htmlComment) {
    element.element = '<!--' 
    element.closer = '-->'
    content = i + 5

    this.handled = true
    return content
  }

  array.push(chunk[i+1])

  if(utils.equalsBuffer(array, this.doctype)) {
    let type = utils.bufferToString(chunk, i + 3, chunk.length)

    element.element = utils.DOCTYPES[type]

    if(element.element === undefined) {
      console.error('Doctype %s not found, falling back to default', type)
      element.element = utils.DOCTYPES['']
    }

    element.closer = ''
    content = chunk.length

    this.handled = true 
    return content
  }

  return content
}

module.exports = Haml
