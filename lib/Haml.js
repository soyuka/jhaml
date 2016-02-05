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
  let first = chunk[i - 1]

  if(first === this.escape) {
    element.start = 0
    element.closed = true
    content = i 
    this.handled = true
    return content
  }

  let array = [first, chunk[i]]

  //HAML comments
  if(this.skip(indent) || utils.equalsBuffer(array, this.comment)) {
    element.closed = true

    if(this.skip_indent === null)
      this.skip_indent = indent

    this.handled = true
    return content
  }

  if(!element.started()) {
    //Code
    if(first === this.code) {
      element.start = i
      element.end = chunk.length
      element.code = true
      element.prefix.open = ''
      element.suffix.open = ' {'
      element.closer = ''
      element.prefix.close = ''
      element.suffix.close = '}'
      this.handled = true
      return content
    }

  }

  //Conditionnal comment
  if(utils.equalsBuffer(array, this.conditionalComment.start)) {

    for(let j = i + 1; j < chunk.length; j++) {
      if(chunk[j] === this.conditionalComment.end) {
        content = j 
        break;
      }
    }

    if(content === null)
      throw new SyntaxError('Conditionnal comment is not closed')

    element.element = '!--'+chunk.slice(i, content + 1)
    element.prefix.close = '<!'
    element.closer = '[endif]--'
    content = content + 1

    this.handled = true
    return content
  }

  //HTML comment
  if(chunk[i - 1] === this.htmlComment) {
    element.element = '!--' 
    element.suffix.open = ''
    element.closer = '--'
    element.prefix.close = ''
    content = i + 5

    this.handled = true
    return content
  }

  array.push(chunk[i+1])

  //Doctype
  if(utils.equalsBuffer(array, this.doctype)) {
    let type = utils.bufferToString(chunk, i + 3, chunk.length)

    element.element = utils.DOCTYPES[type]

    if(element.element === undefined) {
      console.error('Doctype %s not found, falling back to default', type)
      element.element = utils.DOCTYPES['']
    }

    element.closer = false
    element.prefix.open = '<!'
    content = chunk.length

    this.handled = true 
    return content
  }

  let inAttributes = attributes.started() && !attributes.ended()

  if(!inAttributes && chunk[i] === this.space) {
    let first = chunk[i-2]
    let second = chunk[i-1]
    let array = [first, second]

    let isStart = chunk.slice(1, 2).toString() == chunk.slice(i - 2, i - 1)

    if(utils.equalsBuffer(array, this.interpolate)) {
      if(isStart) {
        element.closed = true
        content = i + 1
      }

      element.encode = false
      element.interpolate = true
      this.handled = true
    } else if(utils.equalsBuffer(array, this.encode)) {
      if(isStart) {
        element.closed = true
        content = i + 1
      }

      element.interpolate = true
      element.encode = true
      this.handled = true

    } else if(second === this.interpolate_encode) {
      if(!element.started()) {
        element.closed = true
        content = i+1
      } else {
        element.content = true 
      }

      element.encode = true
      element.interpolate = true
      this.handled = true
    } else if(second === this.encode_interpolated) {
      if(!element.started()) {
        element.closed = true
        content = i+1
      } else {
        element.content = true 
      }

      element.encode = true
    }

    return content
  }

  return content
}

module.exports = Haml
