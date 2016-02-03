'use strict'
const fs = require('fs')
const Transform = require('stream').Transform
const util = require('util')
const Element = require('./Element.js')
const Attributes = require('./Attributes.js')
const Haml = require('./Haml.js')

const utils = require('./utils.js')

const bufferToString = utils.bufferToString
const spaces = utils.spaces

function HamlToHtml(opt, scope) {
  if(!(this instanceof HamlToHtml)) {
    return new HamlToHtml(opt, scope)
  }

  if(!opt)
    opt = {}

  Transform.call(this)

  this.stack = []
  this.garbage = null
  this.line = 0
  this.previousIndent = 0
  this.indentation = null
  this.scope = scope
  this.haml = new Haml()

  utils.toCharBufferMap(utils.CHAR_MAP, this)

  Transform.call(this)
}

util.inherits(HamlToHtml, Transform)

/**
 * @inheritdoc
 */
HamlToHtml.prototype._transform = function(chunk, encoding, callback) {
  let length = chunk.length

  if(this.hasGarbage()) {
    chunk = Buffer.concat([this.garbage, chunk], this.garbage.length + length)
    length = chunk.length
  }

  let start = 0
  let end = 0

  for(let i = 0; i < length; i++) {
    if(this.hasFullLine(chunk, end)) {
      this.processLine(chunk.slice(start, end))
      this.line++
      start = end
    }

    end++
  }

  this.garbage = chunk.slice(start, chunk.length)

  //If no more garbage we hit EOF
  if(!this.hasGarbage()) {
    let e = this.stack.pop()
    let indent = null

    while(e) {
      if(e.element === null) {
        e = this.stack.pop() 
        continue
      }

      if(!e.closed) {
        indent = indent === null ? this.previousIndent : indent - this.indentation

        this.push(spaces(indent) + e.close() + '\n')
      }

      e = this.stack.pop()
    }
  }
}

/**
 * Tests that the garbage contains more than spaces, newlines or null values
 * if it contains only those we reached EOF
 * @return {Boolean}
 */
HamlToHtml.prototype.hasGarbage = function() {
  if(!this.garbage)
    return

  let length = this.garbage.length

  for(let i = 0; i < length; i++) {
    if(!~[this.space, this.cr, this.nl, null].indexOf(this.garbage[i]))
      return true
  }

  return false
}

/**
 * Check if a chunk ends with a comma (might be followed by spaces)
 * @param {Buffer} chunk
 * @param {Number} end position
 */
HamlToHtml.prototype.endsWithComma = function(chunk, end) {
  let i = end
  while(i--) {
    if(chunk[i] === this.space)
      continue

    if(chunk[i] === this.comma)
      return true

    return false
  }
}

/**
 * Tests that the chunk is a full line
 * a full line is identified by \r?\n or a comma
 * Having a comma at the end means that we're in the middle of attributes, 
 * in this case, the parser will continue until it reaches EOL
 * @param {Buffer} chunk
 * @param {Number} end position
 */
HamlToHtml.prototype.hasFullLine = function(chunk, end) {
  let endsWithComma = this.endsWithComma(chunk, end)

  if(chunk[end] === this.nl)
    return !endsWithComma

  if(chunk[end] === this.cr && chunk[end + 1] === this.nl) {
    return !endsWithComma
  }

  return false
}

/**
 * Is the buffer element a quote?
 * @param {Number} element a charCode
 */
HamlToHtml.prototype.isQuote = function(element) {
  return element === this.singleQuote || element === this.doubleQuote
}

/**
 * Line processing
 * This parses the line buffer and gets element, attributes and content
 * @param {Buffer} chunk a full line buffer
 * @return void
 */
HamlToHtml.prototype.processLine = function(chunk) {
  //missing :
  //- script
  //%li= something (html encode), %li!= something (not html encode)
  //& things (encode)
  //:filters
  //variable interpolation (es6 template) 

  let length = chunk.length
  let indent = 0
  let began = false
  let inQuote = false

  let content = null
  let attributes = new Attributes(this.scope)
  let element = new Element(this.scope)
  element.attributes = attributes

  this.haml.handled = false

  for(let i = 0; i < length; i++) {
    //toggle quote
    if(this.isQuote(chunk[i])) {
      inQuote = !inQuote 
    }

    //null nl/cr chunks, we're in a full line, we don't need them
    if(~[this.nl, this.cr].indexOf(chunk[i])) {
      chunk[i] = null
      continue
    }

    //This is were the first not-space character is detected
    if(began) {
   
      if(this.haml.handled === false) {
        content = this.haml.handle(chunk, i, element, attributes, indent)
      }

      if(element.closed)
        break

      //If the element hasn't started yet, the previous character is the first
      if(!element.started()) {
        element.start = i - 1
        continue
      } 

      if(content !== null)
        break

      //we don't care to parse things inside quotes
      if(inQuote) {
        continue
      }

      //Does the attributes start here?
      if(chunk[i - 1] !== this.space && chunk[i] === this.attributes.start) {
        attributes.start = i

        //according to haml specs if the attributes starts, element ends
        //we could change this behavior to enable classes/ids after attributes
        //for example: %label{for: 'foo'}.bar
        if(!element.ended())
          element.end = i

        continue 
      }

      //we're currently inside attributes, just wait until they ends
      if(attributes.started() && !attributes.ended()) {
        if(chunk[i] !== this.attributes.end) {
          continue 
        } 

        attributes.end = i + 1
        continue
      }

      //the chunk is a space, we're not inside attributes
      if(chunk[i] === this.space) {
        //there might be no elements, and if there are no attributes,
        //element ends here
        if(element.started() && !attributes.started()) {
          element.end = i
        }

        //next characters are content, we can end the loop
        if(attributes.ended() || element.ended()) {
          content = i + 1 
          element.content = true
          break
        }
      }
    }

    //Parse indentation
    if(!began && chunk[i] === this.space) {
      indent++
      continue
    }

    //not a space, the next characters are building our haml element/content
    began = true

    //remove dual spaces
    if(chunk[i] === this.space && chunk[i + 1] === this.space) {
      chunk[i] = null
      continue
    }

  }

  //get file indentation once
  if(this.indentation === null && indent > 0) {
    this.indentation = indent
  }

  //parse element
  if(!element.closed) {
    element.parse(chunk)
  }

  //parse attributes
  if(attributes.ended()) {
    attributes.parse(chunk)
  }

  //there was no element, chunk is content-only
  if(element.element === null && !element.closed) {
    content = bufferToString(chunk)
  } else {
    content = content !== null ? bufferToString(chunk, content) : ''
  }

  if(content.length === 0)
    element.content = false

  //Close previously opened tags, to do so we just remove elements from
  //our stack one by one and close them
  if(indent <= this.previousIndent) {
    let cursor = this.previousIndent + this.indentation

    while(cursor > indent) {
      let previous = this.stack.pop()
      cursor -= this.indentation

      if(!previous)
        break

      if(previous.element === null || previous.closed)
        continue

      if(previous.content === false) {
        this.push('\n' + spaces(cursor))
      }

      this.push(previous.close())
    }

    this.previousIndent = indent
  } 

  //Open the current element
  if(indent >= this.previousIndent) {
    if(element.started()) {
      this.push('\n' + spaces(indent) + element.open(indent))
    }

    //Got content in it
    if(content.length) {
      this.push(content)
    }

  } 

  //add this non-closed element to the stack
  this.stack.push(element)

  this.previousIndent = indent
}

/**
 * @inheritdoc
 */
HamlToHtml.prototype._flush = function(callback) {

  callback()
}

module.exports = HamlToHtml
