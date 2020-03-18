var generateTemplate = require('./lib/generateCloudformationTemplate')
var deployTemplate = require('././lib/deployBasicTemplate')

let template = generateTemplate('gkpty.com', 'index.html', false)

deployTemplate('gkpty.com', JSON.stringify(template))
