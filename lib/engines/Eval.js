'use strict'
const vm = require('vm')
const util = require('util')

function Eval() {
  if(!(this instanceof Eval))
    return new Eval()

  this._javascript = ''
  this._lineOffset = 0
}

Eval.prototype.start = function() {
  this.currentEngine._javascript += "'use strict';"
  this.currentEngine._javascript += "var __html = '';"
}

Eval.prototype.shadowLine = function(element, indent) {
  if(element.element === null)
    this.currentEngine._lineOffset++
  
}

Eval.prototype.close = function(element, indent) {
  if(element.content === false) {
    this.currentEngine._javascript += '\n'
    this.currentEngine._lineOffset--
  }

  this.currentEngine._javascript += element.close()
}

Eval.prototype.open = function(element, indent) {
  this.currentEngine._javascript += '\n'
  this.currentEngine._javascript += element.open()
}

Eval.prototype.content = function(content, element, indent) {
  this.currentEngine._javascript += content

  return content
}

Eval.prototype.end = function() {
  let sandbox = util._extend({}, this.scope)

  // console.error(this.currentEngine._javascript, this.currentEngine._lineOffset)

  vm.runInNewContext(this.currentEngine._javascript, sandbox, {
    filename: 'HAML',
    lineOffset: this.currentEngine._lineOffset
  })

  this.push(sandbox.__html)
}

module.exports = Eval
