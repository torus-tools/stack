var generateTemplate = require('../lib/generateTemplate')
var validateTemplate = require('./validateTemplate')

generateTemplate('supereasyforms.com', 'index.html','error.html', true, true, true).then((data) => {
  if(data) validateTemplate(data.template)
})
