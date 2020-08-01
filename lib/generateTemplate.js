const resourceExists = require('./existingResources/aws');
const {initialTemplate, importables, templateDefaults} = require('./templateDefaults')

const resourceNames = {
  bucket: "RootBucket",
  www: "WwwBucket",
  cdn: "CloudFrontDist",
  route53: "HostedZone",
  https: "AcmCertificate"
}

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

module.exports = function genTemplate(domain, stack, options, template, overwrite){
  return new Promise((resolve, reject) => {
    if(domainIsValid(domain)){
      let stackSize = 0;
      for(let resource in stack) {
        if(stack[resource]) stack[resource] = resourceNames[resource]
      }
      if(!options || !options.index) options.index = 'index.html'
      if(!options || !options.error) options.error = 'error.html'
      let defaults = templateDefaults(domain, stack, options)
      if(!template) template = initialTemplate
      template.Resources['BucketPolicy'] = defaults['BucketPolicy']
      template.Resources['RecordSet'] = defaults['RecordSet']
      if(overwrite) {
        for(let key in stack) if(stack[key]){
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
      if(options.https){
        CloudFrontDist.Properties.DistributionConfig["ViewerCertificate"] = {
          "AcmCertificateArn" : { "Ref": "AcmCertificate"},
          "MinimumProtocolVersion" : "TLSv1.2_2018",
          "SslSupportMethod" : "sni-only"
        }
        CloudFrontDist.Properties.DistributionConfig["Aliases"] = [
          domain,
          `www.${domain}`
        ]
        CloudFrontDist["DependsOn"] = ["AcmCertificate"];
      }
      //generate the resources to import array
      let ResourcesToImport = []
      let comparison = 0;
      for(let resource in stack) if(stack[resource] && resourceExists[stack[resource]]){
        comparison +=1;
        resourceExists[stack[resource]](domain).then(data => {
          if(data && importables[stack[resource]]) addToResources(ResourcesToImport, resource, data, template.Resources[Resource].Type)
          if(comparison === stackSize) resolve({"template":template, "existingResources": ResourcesToImport})
        })
      }
    }
    else reject('Error: Please use a valid domain name')
  })
}