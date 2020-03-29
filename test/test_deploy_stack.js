var generateTemplate = require('../lib/generateTemplate')
var validateTemplate = require('./validateTemplate')

let template = generateTemplate('gkpty.com', 'index.html','error.html', false)
console.log(template)
validateTemplate(JSON.stringify(template.template))
