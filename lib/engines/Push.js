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
  if(this.started)
    this.push('\n')

  this.push(spaces(indent) + element.open())    
}

/**
 * @inheritdoc
 */
Push.prototype.close = function(element, indent) {
  if(element.content === false)
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
  // this.push(null)
  cb()
}

module.exports = Push
