'use strict'
const hamlJS = require('./haml-js/lib/haml')
const fs = require('fs')

hamlJS.render(fs.readFileSync(`${__dirname}/page.haml`))
