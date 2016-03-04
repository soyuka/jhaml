# Benchmark

[![asciicast](https://asciinema.org/a/36893.png)](https://asciinema.org/a/36893)

http://soyuka.me/benchmarking-nodejs-streams/

Computer informations:

```
Intel(R) Core(TM) i5-4590 CPU @ 3.30GHz
MemTotal:        8096856 kB
Device Model:     Samsung SSD 840 EVO 250GB
```

## Api-benchmark

```bash
cd test/benchmark
npm install
node express.js #listens on 3002
```

The express app has 5 routes:
- `/` - normal render mode
- `/pipe` - just pipe haml to res
- `/cached` - cache javascript per view
- `/hamljs` - hamljs rendering
- `/hamljs/cached` - hamljs cached rendering

Start api benchmarks:

```bash
node index.js
```

Results:

```bash
server1/cached x 700 ops/sec ±8.35% (1000 runs sampled)
server1/pipe x 295 ops/sec ±5.59% (1000 runs sampled)
server1/render x 294 ops/sec ±10.09% (1000 runs sampled)
server1/hamljs x 1,401 ops/sec ±3.71% (1000 runs sampled)
server1/hamljscached x 1,923 ops/sec ±5.92% (1000 runs sampled)
```

## Siege results

Normal render function:

```bash
(master ✗)❯ sudo siege -c1 -b -t10s http://localhost:3002/

Transactions:                   3402 hits
Availability:                 100.00 %
Elapsed time:                   9.83 secs
Data transferred:               5.16 MB
Response time:                  0.00 secs
Transaction rate:             346.08 trans/sec
Throughput:                     0.52 MB/sec
Concurrency:                    0.99
Successful transactions:        3402
Failed transactions:               0
Longest transaction:            0.16
Shortest transaction:           0.00
```

Pipe:

```bash
(master ✗)❯ sudo siege -c1 -b -t10s http://localhost:3002/pipe

Transactions:                   3237 hits
Availability:                 100.00 %
Elapsed time:                   9.77 secs
Data transferred:               4.91 MB
Response time:                  0.00 secs
Transaction rate:             331.32 trans/sec
Throughput:                     0.50 MB/sec
Concurrency:                    0.99
Successful transactions:        3237
Failed transactions:               0
Longest transaction:            0.25
Shortest transaction:           0.00
```

Cache:

```bash
(master ✗)❯ sudo siege -c1 -b -t10s http://localhost:3002/cached

Transactions:                   9299 hits
Availability:                 100.00 %
Elapsed time:                   9.36 secs
Data transferred:              14.09 MB
Response time:                  0.00 secs
Transaction rate:             993.48 trans/sec
Throughput:                     1.51 MB/sec
Concurrency:                    0.99
Successful transactions:        9299
Failed transactions:               0
Longest transaction:            0.30
Shortest transaction:           0.00
```

Hamljs:

```bash
(master ✗)❯ sudo siege -c1 -b -t10s http://localhost:3002/hamljs

Transactions:                  22514 hits
Availability:                 100.00 %
Elapsed time:                   9.50 secs
Data transferred:              32.89 MB
Response time:                  0.00 secs
Transaction rate:            2369.89 trans/sec
Throughput:                     3.46 MB/sec
Concurrency:                    0.98
Successful transactions:       22514
Failed transactions:               0
Longest transaction:            0.01
Shortest transaction:           0.00
```

Hamljs-cached:

```bash
(master ✗)❯ sudo siege -c1 -b -t10s http://localhost:3002/hamljs/cached

Transactions:                  37803 hits
Availability:                 100.00 %
Elapsed time:                   9.80 secs
Data transferred:              55.23 MB
Response time:                  0.00 secs
Transaction rate:            3857.45 trans/sec
Throughput:                     5.64 MB/sec
Concurrency:                    0.97
Successful transactions:       37803
Failed transactions:               0
Longest transaction:            0.02
Shortest transaction:           0.00
```
