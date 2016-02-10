'use strict'
const spaces = require('../utils.js').spaces

/**
 * Engine that just writes HTML
 */
function Push() {
  if(!(this instanceof Push))
    return new Push()
}

/**
 * @inheritdoc
 */
Push.prototype.open = function(element, indent) {

  let previous = this.stack[this.stack.length - 1]
  let space = true

  if(element.whitespaceremoval.before === true)
    space = false
  else if(previous) {
    if(previous.whitespaceremoval.after === true) 
      space = false
  }

  if(this.started && space)
    this.push('\n')

  if(space)
    this.push(spaces(indent))

  this.push(element.open())    
}

/**
 * @inheritdoc
 */
Push.prototype.close = function(element, indent) {
  if(element.whitespaceremoval.after === false && element.content === false)
    this.push('\n' + spaces(indent))

  this.push(element.close())
}

/**
 * @inheritdoc
 */
Push.prototype.content = function(content, element, indent) {
  this.push(content) 
}

Push.prototype.end = function(cb) {
  cb()
}

module.exports = Push
