'use strict'
const vm = require('vm')
const util = require('util')
const spaces = require('../utils.js').spaces

/**
 * Matches interpolated content #{some "{{content}}" here}
 */
const interpolatedContentRegex = new RegExp(/#{[^}]*?(?:(?:('|")[^'"]*?\1)[^}]*?)*}/g)

function Javascript(opts) {
  if(!(this instanceof Javascript))
    return new Javascript(opts)

  if(!opts)
    opts = {}

  if(opts.filename)
    this.filename = opts.filename
  else
    this.filename = 'JHaml'

  this._javascript = ''
  this._lineOffset = 0
  this.eval = opts.eval === undefined ? true : opts.eval
}

/**
 * Push wrapped data to append it to the __html string 
 * @param {String} data
 */
Javascript.prototype.wrapAndPush = function(data) {
  return this.push(`__html += \`${data}\`;`)
}

/**
 * Push code to the _javascript string
 * @param {String} data
 */
Javascript.prototype.push = function(data) {
  this._javascript += '\n' + data
}

/**
 * We've a line that will not end up in the html, increase the offset
 * @inheritdoc
 */
Javascript.prototype.shadowLine = function(element, indent) {
  this.currentEngine._lineOffset++
}

/**
 * @inheritdoc
 */
Javascript.prototype.start = function() {
  this.currentEngine.push("'use strict';")
  this.currentEngine.push("var __html = '';")
  this.currentEngine._lineOffset = this.currentEngine._lineOffset - 2
}

/**
 * Open code
 * @TODO improve open/closing tag so that .forEach() can be used
 * @param {Number} indent
 */
Javascript.prototype.openCode = function(indent) {
  let previous = this.stack[this.stack.length - 1]

  if(!previous)
    return

  if(previous.code === true && this.previousIndent < indent) {
    this.currentEngine.push('{')
    previous.codeOpen = true
  }
}

/**
 * Close Code
 * @TODO improve open/closing tag so that .forEach() can be used
 * @param {Number} indent
 */
Javascript.prototype.closeCode = function(element, indent) {
  if(element.codeOpen)
    this.currentEngine.push('}')
}

/**
 * @inheritdoc
 */
Javascript.prototype.open = function(element, indent) {

  this.currentEngine.openCode.bind(this)(indent)

  if(element.code) {
    this.currentEngine.push(spaces(indent) + element.open())
    return
  }

  let previous = this.stack[this.stack.length - 1]
  let space = true

  if(element.whitespaceremoval.before === true)
    space = false
  else if(previous) {
    if(previous.whitespaceremoval.after === true) 
      space = false
  }

  let prefix = space ? spaces(indent) : ''

  if(this.started && space) {
    prefix = '\\n'+prefix
  }

  this.currentEngine.wrapAndPush(prefix + element.open())
}

/**
 * @inheritdoc
 */
Javascript.prototype.close = function(element, indent, test) {
  let prefix = ''

  if(element.whitespaceremoval.after === false && element.content === false && !element.code) {
    prefix = '\\n' + spaces(indent)
  }

  this.currentEngine._lineOffset--

  if(element.code) {
    this.currentEngine.push(spaces(indent) + element.close())
    this.currentEngine.closeCode.bind(this)(element, indent)
  } else
    this.currentEngine.wrapAndPush(prefix + element.close())
}

/**
 * @inheritdoc
 */
Javascript.prototype.content = function(content, element, indent) {

  if(element.interpolate && element.encode === false)
    content = '${'+content+'}'
  else if(element.interpolate)
    content = '${__encode('+content+')}'

  if(/#{/g.test(content)) {
    let match = interpolatedContentRegex.exec(content) 

    while(match) {
      let str = match[0].replace(/^#{/, '').replace(/}$/, '')
      if(element.encode !== false)
        str = '__encode('+str+')'

      content = content.replace(match[0], '${'+str+'}')
      match = interpolatedContentRegex.exec(content)
    }
  }

  if(element.tag.open !== null)
    this.currentEngine._lineOffset--

  if(element.closed && this.started)
    content = '\\n'+content

  content = `__html += \`${content}\`;`

  this.currentEngine.push(content)

  return content
}

/**
 * @inheritdoc
 */
Javascript.prototype.end = function(cb) {
  let sandbox = util._extend({}, this.scope)

  if(!this.currentEngine.eval) {
    return this.push(this.currentEngine._javascript)
  }

  try {
    vm.runInNewContext(this.currentEngine._javascript, sandbox, {
      filename: this.currentEngine.filename,
      lineOffset: this.currentEngine._lineOffset
    })
  } catch(e) {
    if(e instanceof SyntaxError) {
      console.error('Syntax error on file', this.currentEngine.filename);
      console.error(this.currentEngine._javascript)
    }

    return cb(e)
  }

  this.push(sandbox.__html)

  setImmediate(() => cb())
}

module.exports = Javascript
