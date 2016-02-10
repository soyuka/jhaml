'use strict'
const utils = require('../utils')

/**
 * HAML syntax handler
 */
function Haml() {
  if(!(this instanceof Haml))
    return new Haml()

  utils.toCharBufferMap(utils.CHAR_MAP, this)

  this.handled = false
  this.skip_indent = null
}

/**
 * Whether we're in a HAML comment or not
 * @param {Number} indent
 * @return {Boolean}
 */
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
 * Handles the chunk and modify the element/attributes according to the parsing
 * result
 * @param {Buffer} chunk
 * @param {Number} i - current char cursor
 * @param {Element} element - current element
 * @param {Attributes} attributes - current attributes
 * @param {Number} indent - current indentation
 * @return {Number|null} content the content new index (will break the loop) or null
 */
Haml.prototype.handle = function(chunk, i, element, attributes, indent) {
  let content = null
  let first = chunk[i - 1]

  //Escape content
  if(first === this.escape) {
    element.start = 0
    element.closed = true
    content = i 
    element.content = true
    this.handled = true
    return content
  }

  let array = [first, chunk[i]]

  //HAML comments
  if(this.skip(indent) || utils.equalsBuffer(array, this.comment)) {
    element.skip = true
    element.closed = true

    if(this.skip_indent === null)
      this.skip_indent = indent

    this.handled = true
    return content
  }

  //white space removal only works after a tag
  if(element.started() && (first === this.lt || first === this.gt)) {
    if(first === this.lt) {
      element.whitespaceremoval.after = true 
    } else if(first === this.gt) {
      element.whitespaceremoval.before = true 
    }

    if(!element.ended())
      element.end = i - 1

    return content
  }

  if(!element.started()) {
    //Code
    if(first === this.code) {
      element.start = i
      element.end = chunk.length
      element.code = true
      element.prefix.open = ''
      element.suffix.open = ''
      element.tag.close = ''
      content = chunk.length
      element.prefix.close = ''
      element.suffix.close = ''
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

    element.tag.open = ''
    element.prefix.open = '<!--'+chunk.slice(i, content + 1)
    element.prefix.close = '<!'
    element.suffix.close = '[endif]-->'
    content = content + 1

    this.handled = true
    return content
  }

  //HTML comment (and is not an ending html tag </)
  if(chunk[i - 1] === this.htmlComment && chunk[i - 2] !== this.lt) {
    element.tag.open = '' 
    element.prefix.open = '<!--'
    element.suffix.open = ''
    element.prefix.close = ''
    element.suffix.close = '-->'
    element.content = true
    content = i

    this.handled = true
    return content
  }

  array.push(chunk[i+1])

  //Doctype
  if(utils.equalsBuffer(array, this.doctype)) {
    let type = utils.bufferToString(chunk, i + 3, chunk.length).trim().toLowerCase()

    element.tag.open = utils.DOCTYPES[type]

    if(element.tag.open === undefined) {
      console.error('Doctype %s not found, falling back to default', type)
      element.tag.open = utils.DOCTYPES['']
    }

    element.selfClose = true
    element.prefix.open = type === 'xml' ? '<?' : '<!'
    element.suffix.open = type === 'xml' ? ' ?>' : '>'
    content = chunk.length

    this.handled = true 
    return content
  }

  let inAttributes = attributes.started() && !attributes.ended()

  //Parses =, !=, &, &= when we've reach the element 
  if(!inAttributes && chunk[i] === this.space) {
    let first = chunk[i-2]
    let second = chunk[i-1]
    let array = [first, second]

    element.interpolate = second === this.interpolate_encode 
    element.encode = true
    element.content = true

    //number of characters that we should remove from element
    let chars = null

    // !=
    if(utils.equalsBuffer(array, this.interpolate)) {
      chars = 2
      element.encode = false
    // &=
    } else if (utils.equalsBuffer(array, this.encode)) {
      chars = 2 
    } else if(second === this.encode_interpolated) {
      chars = 1
      element.interpolate = false 
    } else if(second === this.interpolate_encode) {
      chars = 1 
    }

    if(chars === null) {
      this.handled = true 
      return content
    }

    //hypothetical start cursor
    let startCursor = i - chars - 1
    if(startCursor < 0) startCursor = 0

    //if this an full-part element? != 'test' instead of %p!= 'test'
    if(startCursor === 0 || chunk[startCursor] === this.space) {
      content = i + chars - 1
      element.closed = true
      this.handled = true

      return content
    }

    if(!element.ended())
      element.end = i - chars

    content = i + 1
    this.handled = true

    return content
  }

  return content
}

module.exports = Haml
