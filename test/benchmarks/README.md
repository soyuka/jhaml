# Benchmarks

## Run

```
npm install benchmark 
node streamsuite.js
node algorithm.js
```

## Results

Wait! Note that `jhaml` is an asynchronous stream. I could compare algorithms with other haml implementations but I'm not sure it would reflect the reality. Indeed, they have been built with a goal in mind, here the goal is a fluent HTML output stream from an HAML input.

```
jhaml x 506 ops/sec ±4.63% (74 runs sampled)
jhamltohtml x 628 ops/sec ±7.98% (80 runs sampled)
jhamltojavascript x 714 ops/sec ±2.10% (82 runs sampled)
Fastest is jhamltojavascript
Slowest is jhaml
```

You'll note that as `jhamltohtml` is doing more `.push` than `jhamltojavascript`, it will behave "slower". But, `jhamltojavascript` is keeping the content in memory, which can have an bad impact on big data.

`jhaml` is compiling the javascript, no suprise here, it should be slower.

> `processLine` is the heart method of JHAML which processes an haml line and parses it.

In the following:
- the constructor is called
- `processLine` is called manually with a buffer
- `_flush` is called so that the javascript compilation takes place

The last test is calling the constructor once and then only calling `processLine`. It's reflecting what's happening when processing a large file.

```
jhaml (construct + processLine + flush) x 1,297 ops/sec ±17.87% (64 runs sampled)
jhamltohtml (construct + processLine + flush) x 6,682 ops/sec ±5.66% (69 runs sampled)
jhamltojavascript (construct + processLine + flush) x 6,777 ops/sec ±5.55% (72 runs sampled)
jhamltohtml (construct + processLine) x 7,580 ops/sec ±4.67% (81 runs sampled)
jhamltohtml (processLine) x 13,081 ops/sec ±6.49% (75 runs sampled)
Fastest is jhamltohtml (processLine)
Slowest is jhaml (construct + processLine + flush)

```

Again, no surprise there. First, we can feel that the `javascript` engine takes more time than the simple `html` engine. Then, we see the impact of compiling which reduces the number of ops/sec drastically.
Of course, the main function (`processLine`) is doing just fine on it's own with 13k ops/sec. Also, it shows us that calling the constructor is heavy.
