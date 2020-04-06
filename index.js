var generateTemplate = require('./lib/generateTemplate')
var deployTemplate = require('./lib/deployStack')

let template = generateTemplate('gkpty.com', 'index.html', false)

deployTemplate('gkpty.com', JSON.stringify(template))
