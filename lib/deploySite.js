var generateTemplate = require('../lib/generateTemplate')
var deployStack = require('../lib/deployStack')
var uploadSite = require('../lib/uploadSite')

module.exports = async function deploySite(){
  //generate the template
  let template = await generateTemplate(domain, index, error, cdn, route53, https)
  //deploy the stack
  let stack = await deployStack(domain, template.template, template.existingResources)
  //upload Site
  await uploadSite("site", domain)
}

