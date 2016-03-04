'use strict'
const apiBenchmark = require('api-benchmark');
const fs = require('fs')
const services = {
  server1: "http://localhost:3002/"
};
const routes = { cached: 'cached', pipe: 'pipe', render: '', hamljs: 'hamljs', hamljscached: 'hamljs/cached' };
const options = { debug: true, minSamples: 1000, maxTime: Infinity };

apiBenchmark.measure(services, routes, options, function(err, results){
apiBenchmark.getHtml(results, function(error, html) {
   fs.writeFileSync(`${__dirname}/report.html`, html)
   console.log('Report saved in %s', `${__dirname}/report.html`)
})
});
