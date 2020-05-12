var generateTemplate = require('../lib/generateTemplate');
var {deployStack} = require('../lib/deployStack');
//var uploadSite = require('../lib/uploadSite')

module.exports = async function deploySite(domain, index, error, www, cdn, route53, https){
  generateTemplate(domain, index, error, www, cdn, route53, https).then((data)=>{
    console.log('DEPLOYING STACK')
    deployStack(domain, data.template, data.existingResources, cdn, https, route53)
  }).catch((err) => console.log(err))
}


