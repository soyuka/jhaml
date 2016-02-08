'use strict'
const hamljs = require('./haml.js/lib/haml.js')
const fs = require('fs')

hamljs.render(fs.readFileSync(`${__dirname}/page.haml`))
