# JHAML

Note: Currently a work in progress, filters are not available yet

Lazy? [Jump to usage](https://github.com/soyuka/jhaml#usage)

## Introduction

### Why another HAML implementation?

Because I wanted a streamable HAML implementation. Also, some things didn't work on javascript implementation as they should in comparison to the ruby version. 

For example:
```haml
%div{attr1: 'one', 
  attr2: 'two'} some content
```

Or errors thrown for no obvious reasons:

```haml
%div test
  test
```

Also, I almost never need code interpretation inside HAML but I instead write html templates to be used by angular. This is why this parser provides two different streaming engines:
- one that transforms haml to html
- one that transforms haml to javascript which then evaluates to html

Both are implementing the same `one-pass` algorithm: 

- `jhamltohtml` has a really low memory footprint and is not executing javascript. It just transforms to HTML and writes data as it comes.
- `jhaml` builds javascript in-memory, executes and then streams the result out.

### What's different

**It's a stream!**

Also, when using code interpretation, the haml code is translated to **strict** ES6 javascript. 

This means:
 - it requires node > 4
 - it runs with the help of es6 templates
 - you have to declare variables

For example with [tj/haml.js](https://github.com/tj/haml.js) implementation you was able to do:

```haml
- name = 'test'
%p= name
```

This implementation would require the variable to be defined, mainly because we're in strict mode:

```haml
- let name = 'test'
%p= name
```

You've only access (for now) to basic loops (while, for) and conditions (if, else, switch) but not `.forEach` or `.map` for bloc operations.

For example this will work:

```haml
- let a = [0,1,2].map(i => i+1)
- for(let i in a)
  %p= a[i]
```

You may think a `forEach` loop could work, for example:

```haml
- ;[0,1,2].forEach(function(e)
  %p=e
```

But this will not be closed properly. If you want to do things like that (you should not need this in a template), it'd be written like this:

```haml
- ;[0,1,2].forEach(e => __html += `<p>${e}</p>`)
```

`__html` is a global scope variable in which html is being appended.

And here's how a `switch` would be implemented:

```haml
- switch(interpolated)
  - case 'Test': 
  %p Ok
  - break; 
  - default:
  %p Not ok
```

Basically, code that get's an indented block will be surrounded by `{` and `}`. Code that's on the same indentation will just be executed as is.

An `if/else` condition is written like this:

```haml
- if(disabled)
  %p Disabled
- else if(disabled === false)
  %p Not disabled
- else
  %p Disabled is not defined: "#{disabled}"
```

You can of course execute you own methods:

```haml
- let t = myfunction('foo')
%p= t
-# same result as:
%p #{myfunction('foo')}
```

### Compatibility

This script runs the [tj/haml.js](https://github.com/tj/haml.js) test suite except non-standard `for each` loops. 

**This does not mean that it'll produce the same output!**

## Usage

### With code interpretation

#### CLI

Format: `jhaml [--eval] [json scope] [output file]`

To javascript:

```bash
jhaml --no-eval < file.haml '{"foo": "bar"}'
```

To Haml, pipe output: 

```bash
jhaml < file.haml '{"foo": "bar"}' > file.html
```

To Haml, creates a write stream:

```bash
jhaml < file.haml output.html
```

#### Programmatic

```javascript
const jhaml = require('jhaml')
const fs = require('fs')
const scope = {foo: 'bar'}

fs.createReadStream(`source.haml`)
.pipe(jhaml(scope))
```

### Without code interpretation

#### CLI

```bash
jhamltohtml < file.haml > output.html
jhamltohtml < file.haml output.html
```

#### Programmatic

```javascript
const jhaml = require('jhaml')
const fs = require('fs')
const scope = {foo: 'bar'}

fs.createReadStream(`source.haml`)
.pipe(jhaml.tohtml(scope))
```

### Gulp


