'use strict'
const interpolatedContentRegex = new RegExp(/#{(.*?)}/g)

function Javascript() {
  if(!(this instanceof Javascript))
    return new Javascript()
}

Javascript.prototype.close = function(element, indent) {
  if(!element.code) {
    element.prefix.close = `__html += \`${element.prefix.close}`
    element.suffix.close = `${element.suffix.close}\`;`
  }
}

Javascript.prototype.open = function(element, indent) {
  if(!element.code) {
    element.prefix.open = `__html += \`${element.prefix.open}`
    element.suffix.open = `${element.suffix.open}\`;`
  }
}

Javascript.prototype.content = function(content, element, indent) {
  if(element.interpolate && element.encode === false)
    content = '${'+content+'}'
  else if(element.interpolate)
    content = '${__encode('+content+')}'

  if(/#{/g.test(content)) {
    if(element.encode === false) {
      content = content.replace(/#{/g, '${')
    } else {
      let match = interpolatedContentRegex.exec(content) 

      while(match) {
        content = content.replace(match[0], '${__encode('+match[1]+')}')
        match = interpolatedContentRegex.exec(content)
      }
    }
  }

  content = `__html += \`${content}\`;`

  return content
}

module.exports = Javascript
