var generateTemplate = require('../lib/generateTemplate')
var deployStack = require('../lib/deployStack')
//var uploadSite = require('../lib/uploadSite')

module.exports = async function deploySite(domain, index, error, cdn, route53, https){
  //generate the template
  generateTemplate(domain, index, error, cdn, route53, https, (err, data)=>{
    if(err) console.log(err)
    else {
      console.log('DEPLOYING STACK')
      deployStack(domain, data.template, data.existingResources, https, route53)
    }
  })
  //let template = await generateTemplate(domain, index, error, cdn, route53, https)
  //deploy the stack
  //await deployStack(domain, template.template, template.existingResources)
  //upload Site
  //await uploadSite("site", domain)
}


