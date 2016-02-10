'use strict'

/**
 * HAML character map
 */
const CHAR_MAP = {
  cr: '\r',
  nl: '\n',
  tab: '\t',
  space: ' ',
  comma: ',',
  element: '%',
  singleQuote: '\'',
  doubleQuote: '"',
  attributes: {
    start: '{',
    end: '}'
  },
  null: null,
  comment: '-#',
  htmlComment: '/',
  conditionalComment: {
    start: '/[',
    end: ']'
  },
  escape: '\\',
  doctype: '!!!',
  code: '-',
  interpolate_encode: '=',
  interpolate: '!=',
  encode: '&=',
  encode_interpolated: '&',
  lt: '<',
  gt: '>'
}

const BUFFER_CHAR_MAP = {}
toCharBufferMap(CHAR_MAP, BUFFER_CHAR_MAP)

const BUFFER_SPACE_SET = [BUFFER_CHAR_MAP.cr, BUFFER_CHAR_MAP.nl, BUFFER_CHAR_MAP.tab]

const DOCTYPES = {
  '': 'DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"',
  'strict': 'DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"',
  'frameset': 'DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Frameset//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd"',
  '5': 'DOCTYPE html',
  '1.1': 'DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"',
  'basic': 'DOCTYPE html PUBLIC "-//W3C//DTD XHTML Basic 1.1//EN" "http://www.w3.org/TR/xhtml-basic/xhtml-basic11.dtd"',
  'mobile': 'DOCTYPE html PUBLIC "-//WAPFORUM//DTD XHTML Mobile 1.2//EN" "http://www.openmobilealliance.org/tech/DTD/xhtml-mobile12.dtd"',
  'rdfa': 'DOCTYPE html PUBLIC "-//W3C//DTD XHTML+RDFa 1.0//EN" "http://www.w3.org/MarkUp/DTD/xhtml-rdfa-1.dtd"',
  'xml': 'xml version="1.0" encoding="utf-8"'
}

/**
 * Removes BUFFER_SPACE_SET from the buffer by setting null values instead
 * @param {Buffer} chunk
 * @return {Buffer}
 */
function sanitizeBuffer(chunk) {
  let length = chunk.length
  for(let i = 0; i < length; i++) {
    if(
      ~[BUFFER_SPACE_SET].indexOf(chunk[i]) || 
      chunk[i] === BUFFER_CHAR_MAP.space && chunk[i + 1] === BUFFER_CHAR_MAP.space
    ) {
      chunk[i] = null
    }
  }

  return chunk
}

/**
 * Transforms a buffer to a string after sanitizing it
 * @param {Buffer} chunk
 * @param {Number} start optional start position
 * @param {Number} end optional end posititon
 */
function bufferToString(chunk, start, end) {
  if(start !== undefined)
    chunk = chunk.slice(start, end || chunk.length)
  
  return sanitizeBuffer(chunk).toString()
    .replace(/\0/g, '')
    .replace(/`/g, '\\`')
}

/**
 * Recursively transforms a char to an ascii byte code 
 * or to a Buffer (if more than 1 char)
 * those are set on the self element
 * @param {mixed} o
 * @param {Object} self
 */
function toCharBufferMap(o, self) {
  for(let i in o) {
    if(typeof o[i] === 'string') 
      self[i] = o[i].length === 1 ? new Buffer(o[i])[0] : new Buffer(o[i])
    else if(typeof o[i] === 'object') {
      self[i] = {}
      toCharBufferMap(o[i], self[i])
    }
  }
}

/**
 * Compares an array of ascii bytes to a Buffer
 * @param {Array} array
 * @param {Buffer} buffer
 * @return {Boolean} 
 */
function equalsBuffer(array, buffer) {
  return array.filter((e, i) => e !== buffer[i]).length === 0
}

/**
 * A padLeft function to add spaces
 * @param {Number} num
 * @return {String}
 */
function spaces(num) {
  if(!num)
    num = 0

  let str = ''

  for(let i = 0; i < num; i++) { str += ' ' }

  return str
}

module.exports = {
  bufferToString: bufferToString,
  toCharBufferMap: toCharBufferMap,
  equalsBuffer: equalsBuffer,
  spaces: spaces,
  CHAR_MAP: CHAR_MAP,
  DOCTYPES: DOCTYPES
}
