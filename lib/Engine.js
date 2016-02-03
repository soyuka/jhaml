'use strict'
function Engine(engines) {
  if(!(this instanceof Engine))
    return new Engine(engines)

  if(!Array.isArray(engines))
    engines = [engines]

  this.engines = engines
  this.length = engines.length
}

/**
 * Loop through engines, 
 */
Engine.prototype._loop = function() {
  let args = [].slice.call(arguments)
  let method = args.shift()

  for(let i = 0; i < this.engine.length; i++) {
    if(!(method in this.engine.engines[i])) {
      continue 
    }

    this.currentEngine = this.engine.engines[i]
    this.currentEngine[method].apply(this, args)
  }
}

/**
 * Default methods
 */
;['start', 'end', 'close', 'code', 'open', 'shadowLine']
.forEach(function(e) {
  Engine.prototype[e] = function(element, indent) {
    return this.engine._loop.bind(this)(e, element, indent)
  }
})

/**
 * Content replaces the previous content
 */
Engine.prototype.content = function(content, element, indent) {

  for(let i = 0; i < this.engine.length; i++) {
    if(!('content' in this.engine.engines[i])) {
      continue 
    }

    this.currentEngine = this.engine.engines[i]
    content = this.currentEngine.content.bind(this)(content, element, indent)
  }

}

module.exports = Engine
