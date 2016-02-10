'use strict'
const fs = require('fs')
const Transform = require('stream').Transform
const util = require('util')
const Element = require('./parsers/Element.js')
const Attributes = require('./parsers/Attributes.js')
const Haml = require('./parsers/Haml.js')
const Push = require('./engines/Push.js')
const Engine = require('./Engine.js')

const utils = require('./utils.js')

const bufferToString = utils.bufferToString

/**
 * Main transform stream
 * parses the input and handles HAML through parsers 
 * data is then handled by Engines to produce an output
 */
function Parser(opt, scope) {
  if(!(this instanceof Parser)) {
    return new Parser(opt, scope)
  }

  if(!opt)
    opt = {}

  Transform.call(this)

  //Set up the engine
  this.engine = opt.engine ? new Engine(opt.engine) : new Engine(new Push())
  //Stack of non-closed elements to close
  this.stack = []
  //Garbage collector
  this.garbage = null
  //Line cursor
  this.line = 0
  //line we started at
  this.startline = null
  //Previous indentation
  this.previousIndent = 0
  //Current indentation
  this.indentation = null
  //HAML Parser instance
  this.haml = new Haml()
  //End
  this.closed = false

  this.options = opt

  //The eval scope
  this.scope = util._extend({
    __encode: function(str) {
      str = ''+str
      return str.replace(/&/g, '&amp;') 
        .replace(/>/g, '&gt;')
        .replace(/</g, '&lt;')
        .replace(/"/g, '&quot;')
    }
  }, scope)

  //@see utils
  utils.toCharBufferMap(utils.CHAR_MAP, this)

  Transform.call(this)
}

util.inherits(Parser, Transform)

Object.defineProperty(Parser.prototype, 'started', {
  get: function getStarted() {
    return this.line > this.startline
  }
})

/**
 * @inheritdoc
 */
Parser.prototype._transform = function(chunk, encoding, callback) {

  if(this.indentation === null) {
    this.engine.start.bind(this)()
  }

  let length = chunk.length

  if(this.hasGarbage()) {
    chunk = Buffer.concat([this.garbage, chunk], this.garbage.length + length)
    length = chunk.length
  }

  let start = 0
  let end = 0

  try {
    for(let i = 0; i <= length; i++) {
      if(this.hasFullLine(chunk, end)) {
        this.processLine(chunk.slice(start, end))
        this.line++
        start = end
      }

      end++
    }
  } catch(e) {
    callback(e) 
  }

  this.garbage = chunk.slice(start, chunk.length)

  callback()
}

/**
 * Tests that the garbage contains more than spaces, newlines or null values
 * if it contains only those we reached EOF
 * @return {Boolean}
 */
Parser.prototype.hasGarbage = function() {
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
Parser.prototype.endsWithComma = function(chunk, end) {
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
Parser.prototype.hasFullLine = function(chunk, end) {
  let endsWithComma = this.endsWithComma(chunk, end)

  if(chunk[end] === this.nl)
    return !endsWithComma

  if(chunk[end] === this.cr) {
    return !endsWithComma
  }

  if(chunk[end] === this.cr && chunk[end + 1] === this.nl) {
    return !endsWithComma 
  }

  return chunk.length === end
}

/**
 * Is the buffer element a quote?
 * @param {Number} element a charCode
 */
Parser.prototype.isQuote = function(element) {
  return element === this.singleQuote || element === this.doubleQuote
}

/**
 * Line processing
 * This parses the line buffer and gets element, attributes and content
 * @param {Buffer} chunk a full line buffer
 * @return void
 */
Parser.prototype.processLine = function(chunk) {
  //missing :
  //:filters
  let length = chunk.length
  let indent = 0
  let began = false
  let inQuote = false

  let content = null
  let attributes = new Attributes(this.options)
  let element = new Element(this.options)
  element.attributes = attributes

  this.haml.handled = false

  for(let i = 0; i <= length; i++) {
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
        if(chunk[i] === this.attributes.start) {
          attributes.embed++
          continue
        }

        if(chunk[i] !== this.attributes.end) {
          continue 
        } else if(attributes.embed > 0) {
          attributes.embed--
          continue
        }

        attributes.end = i + 1
        continue
      }

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

      //the chunk is a space, we're not inside attributes
      if(chunk[i] === this.space) {
        //there might be no elements, and if there are no attributes,
        //element ends here
        if(element.started() && !attributes.started() && !element.ended()) {
          element.end = i
        }

        //next characters are content, we can end the loop
        if(attributes.ended() || element.ended()) {
          content = i + 1 
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
    }

  }

  if(this.startline === null && element.started() && !element.code) {
    this.startline = this.line
  }

  //get file indentation once
  if(this.indentation === null && indent > 0) {
    this.indentation = indent
  }

  //haml comments or empty elements
  if(element.skip || element.tag.open === null && !element.started() && !element.closed) {
    this.engine.shadowLine.bind(this)(element, indent)
    return
  }

  //parse element
  if(!element.closed) {
    element.parse(chunk)
  }

  //parse attributes
  if(attributes.ended()) {
    attributes.parse(chunk)
  } else {
    //handles element attributes if any
    attributes.parse() 
  }

  //there was no element, chunk is content-only
  if(element.tag.open === null && !element.closed) {
    content = bufferToString(chunk, indent === 0 ? 0 : indent + 1)
  } else {
    content = content !== null ? bufferToString(chunk, content) : ''
  }

  if(content.trim().length > 0)
    element.content = true
  else
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

      if(previous.tag.open === null || previous.closed)
        continue

      this.engine.close.bind(this)(previous, cursor)
    }

    this.previousIndent = indent

    let previous = this.stack[0]

    if(previous && indent === 0 && previous.content === true) {
      this.engine.close.bind(this)(previous, indent)
      this.stack.pop()
    }
  } 

  //Open the current element
  if(indent >= this.previousIndent) {
    if(element.started()) {
      this.engine.open.bind(this)(element, indent)
    }

    //Got content in it
    if(element.content === true) {
      this.engine.content.bind(this)(content, element, indent)
    }
  } 

  this.stack.push(element)

  this.previousIndent = indent
}

//@TODO fix this.closed === false, this should be called once
Parser.prototype._flush = function(callback) {
  let e = this.stack.pop()
  let indent = null

  while(e) {
    if(!e.closed) {
      indent = indent === null ? this.previousIndent : indent 

      this.engine.close.bind(this)(e, indent)

      indent -= this.indentation
    }

    e = this.stack.pop()
  }

  if(this.stack.length === 0 && this.closed === false)  {
    this.closed = true

    this.engine.end.bind(this)(callback)
  }
}

module.exports = Parser
