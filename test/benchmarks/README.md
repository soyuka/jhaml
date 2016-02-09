# Benchmarks

Against `tj/haml.js` and `creationix/hamljs`. Note that I had to hard fix a `Cannot call substr of undefined` error in `creationix/hamljs`.


## Run

```
git clone https://github.com/tj/haml.js
git clone https://github.com/creationix/haml-js
npm install benchmark 
node suite.js
# or
npm install bench
node bench.js
```

## Results

I'm really wondering where tj see's a 65% speed improvement when compared to `haml-js` but whatever. This library has not been built for speed, but it's performances are basically the same as the others.

```
{ http_parser: '2.6.0',
  node: '5.3.0',
  v8: '4.6.85.31',
  uv: '1.8.0',
  zlib: '1.2.8',
  ares: '1.10.1-DEV',
  icu: '56.1',
  modules: '47',
  openssl: '1.0.2e' }
Scores: (bigger is better)

jhaml
Raw:
 > 167.4975074775673
 > 167.66467065868264
 > 167.66467065868264
 > 167.4975074775673
Average (mean) 167.58108906812498

haml.js
Raw:
 > 167.33067729083666
 > 167.33067729083666
 > 167.33067729083666
 > 166.66666666666666
Average (mean) 167.16467463479415

haml-js
Raw:
 > 166.33466135458167
 > 166.33466135458167
 > 166.50049850448653
 > 166.50049850448653
Average (mean) 166.4175799295341

Winner: jhaml
Compared with next highest (haml.js), it's:
0.25% faster
1 times as fast
0 order(s) of magnitude faster
BASICALLY THE SAME

Compared with the slowest (haml-js), it's:
0.69% faster
1.01 times as fast
0 order(s) of magnitude faster
```
