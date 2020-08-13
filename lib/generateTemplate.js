const resourceExists = require('./resourceExists');
const {initialTemplate, stackResources, importables, templateDefaults} = require('./templateDefaults')

function domainIsValid(domainName){
  if (/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(domainName)) return true;
  else return false;
}

function addToResources(array, LogicalResourceId, ResourceIdentifier, ResourceType){
  let resource = {
    'LogicalResourceId': LogicalResourceId,
    'ResourceIdentifier': {
      '<ResourceIdentifierPropertyKey>': ResourceIdentifier,
    },
    'ResourceType': ResourceType
  }
  array.push(resource)
}

module.exports = function genTemplate(domain, stack, config, template, overwrite){
  return new Promise((resolve, reject) => {
    if(domainIsValid(domain)){
      let stackSize = 0;
      for(let resource in stack) {
        if(stack[resource]) stack[resource] = stackResources[resource]
      }
      if(!config || !config.index) config.index = 'index.html'
      if(!config || !config.error) config.error = 'error.html'
      let defaults = templateDefaults(domain, stack, config)
      if(!template) template = initialTemplate
      
      if(stack.bucket) template.Resources['BucketPolicy'] = defaults['BucketPolicy']
      if(stack.dns && config.providers.dns === 'aws') template.Resources['RecordSet'] = defaults['RecordSet']

      if(overwrite) {
        for(let key in stack) if(stack[key]){
          //should also check that the provider for the given key is AWS
          if(resourceExists[stack[key]]) stackSize+=1
          template.Resources[key] = defaults[key]
        }
      }
      else {
        for(let key in stack) {
          if(stack[key]) {
            if(resourceExists[stack[key]]) stackSize+=1
            if(!template.Resources[stack[key]]) template.Resources[stack[key]] = defaults[stack[key]]
          } 
        } 
      } 
      //custom stuff for the CDN depending on the https option
      if(stack.https){
        template.Resources.CloudFrontDist.Properties.DistributionConfig["ViewerCertificate"] = {
          "AcmCertificateArn" : { "Ref": "AcmCertificate"},
          "MinimumProtocolVersion" : "TLSv1.2_2018",
          "SslSupportMethod" : "sni-only"
        }
        template.Resources.CloudFrontDist.Properties.DistributionConfig["Aliases"] = [
          domain,
          `www.${domain}`
        ]
        template.Resources.CloudFrontDist["DependsOn"] = ["AcmCertificate"];
      }
      //generate the resources to import array
      let ResourcesToImport = []
      let comparison = 0;
      for(let resource in stack) if(stack[resource] && resourceExists[stack[resource]]){
        comparison +=1;
        resourceExists[stack[resource]](domain).then(data => {
          if(importables[stack[resource]] && data && data.id) addToResources(ResourcesToImport, stack[resource], data.id, template.Resources[stack[resource]].Type)
          if(comparison === stackSize) resolve({"template":template, "existingResources": ResourcesToImport})
        })
      }
    }
    else reject('Error: Please use a valid domain name')
  })
}