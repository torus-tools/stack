var generateTemplate = require('../lib/generateCloudformationTemplate')
var validateTemplate = require('./validateTemplate')

let template = generateTemplate('gkpty.com', 'index.html', false)

validateTemplate(JSON.stringify(template))
