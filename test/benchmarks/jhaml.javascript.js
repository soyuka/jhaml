'use strict'
const jhaml = require('../../')({}, {eval: false})
const fs = require('fs')

let stream = fs.createReadStream(`${__dirname}/page.haml`)

stream.pipe(jhaml)
