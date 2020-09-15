const resourceExists = require('./resourceExists');
const {initialTemplate, stackResources, importables, templateDefaults} = require('./templateDefaults')

function domainIsValid(domainName){
  if (/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(domainName)) return true;
  else return false;
}

function addToResources(array, LogicalResourceId, ResourceIdentifier, ResourceType, resourceIdentifierType){
  return new Promise((resolve, reject) => {
    let resource = {
      'LogicalResourceId': LogicalResourceId,
      'ResourceIdentifier': {},
      'ResourceType': ResourceType
    }
    resource.ResourceIdentifier[resourceIdentifierType] = ResourceIdentifier
    array.push(resource)
    resolve(resource)
  })
}

module.exports = function genTemplate(domain, stack, config, template, records, overwrite){
  return new Promise((resolve, reject) => {
    if(domainIsValid(domain)){
      let stackSize = 0;
      for(let resource in stack) {
        if(stack[resource]) stack[resource] = stackResources[resource]
      }
      //console.log('STACK ', stack, template)
      let defaults = templateDefaults(domain, stack, config)
      //if(!config || !config.options || !config.options.index) config.index = 'index.html'
      //if(!config || !config.options || !config.options.error) config.error = 'error.html'
      let new_temp = template? template : initialTemplate
      if(stack.bucket) new_temp.Resources['BucketPolicy'] = defaults['BucketPolicy']
      if(records && stack.dns && config.providers.dns === 'aws') new_temp.Resources['RecordSet'] = defaults['RecordSet']
      if(overwrite) {
        for(let key in stack) if(stack[key]){
          //should also check that the provider for the given key is AWS
          if(resourceExists[stack[key]]) stackSize+=1
          new_temp.Resources[key] = defaults[key]
        }
      }
      else {
        //console.log('STACK2 ', stack, new_temp)
        for(let key in stack) {
          //console.log(key)
          if(stack[key] && config.providers[key] === 'aws' || stack[key] && !config.providers[key]) {
            //console.log(defaults[stack[key]])
            if(resourceExists[stack[key]]) stackSize+=1
            if(!new_temp.Resources[stack[key]]) new_temp.Resources[stack[key]] = defaults[stack[key]]
          } 
        } 
        //console.log('STACK2 ', stack, new_temp)
      } 
      //custom stuff for the CDN depending on the ssl option
      if(stack.ssl && config.providers.ssl === 'aws'){
        new_temp.Resources.CloudFrontDist.Properties.DistributionConfig["ViewerCertificate"] = {
          "AcmCertificateArn" : { "Ref": "AcmCertificate"},
          "MinimumProtocolVersion" : "TLSv1.2_2018",
          "SslSupportMethod" : "sni-only"
        }
        new_temp.Resources.CloudFrontDist.Properties.DistributionConfig["Aliases"] = [
          domain,
          `www.${domain}`
        ]
        new_temp.Resources.CloudFrontDist["DependsOn"] = ["AcmCertificate"];
      }
      //generate the resources to import array
      let ResourcesToImport = []
      let comparison = 0;
      for(let resource in stack) if(stack[resource] && resourceExists[stack[resource]] && config.providers[resource] === 'aws'){
        //console.log('RESOURCE ', resource, '  ', stack[resource])
        comparison +=1;
        resourceExists[stack[resource]](domain).then(data => {
          //console.log('DATA ', data)
          if(importables[stack[resource]] && data && data.id) {
            addToResources(ResourcesToImport, stack[resource], data.id, new_temp.Resources[stack[resource]].Type, importables[stack[resource]])
            .then((resource)=>{
              //console.log('RESOURCE ', resource)
              if(comparison === stackSize) {
                //console.log('STACK 3 ', stack, new_temp)
                resolve({"template":new_temp, "existingResources": ResourcesToImport})
              }
            })
          }
          else {
            if(comparison === stackSize) {
              //console.log('STACK 3 ', stack, new_temp)
              resolve({"template":new_temp, "existingResources": ResourcesToImport})
            }
          }
        })
      }
    }
    else reject('Error: Please use a valid domain name')
  })
}