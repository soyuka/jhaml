'use strict'
const spaces = require('../utils.js').spaces

function Push() {
  if(!(this instanceof Push))
    return new Push()
}

Push.prototype.close = function(element, indent) {
  if(element.content === false)
    this.push('\n' + spaces(indent))

  this.push(element.close())
}

Push.prototype.open = function(element, indent) {
  this.push('\n' + spaces(indent) + element.open())    
}

Push.prototype.content = function(content, element, indent) {
 this.push(content) 
}

module.exports = Push
