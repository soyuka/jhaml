'use strict'
const hamlJS = require('./haml-js/lib/haml')

module.exports = function(js) {
  hamlJS.render(js)  
}
