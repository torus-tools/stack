var generateTemplate = require('../lib/generateTemplate');
var {deployStack} = require('../lib/deployStack');
//var uploadSite = require('../lib/uploadSite')

module.exports = async function deploySite(domain, index, error, www, cdn, route53, https){
  generateTemplate(domain, index, error, www, cdn, route53, https).then((data)=>{
    let templateString = JSON.stringify(data.template)
    console.log('DEPLOYING STACK')
    deployStack(domain, templateString, data.existingResources, cdn, https, route53)
  }).catch((err) => console.log(err))
}


