var generateTemplate = require('../lib/generateTemplate')
var validateTemplate = require('./validateTemplate')

async function test(){
  await generateTemplate('supereasyforms.com', 'index.html','error.html', true, true, true)
  await console.log(console.log('hIPYYSJS'))
}

test()