const ResourceExists = require('./existingResources/aws');
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

module.exports = async function genTemplate(domain, stack, options, template, overwrite){
  return new Promise((resolve, reject) => {
    if(domainIsValid(domain)){
      for(let resource in stack) if(stack[resource]) stack[resource] = resourceNames[resource]
      if(!options || !options.index) options.index = 'index.html'
      if(!options || !options.error) options.error = 'error.html'
      let defaults = templateDefaults(domain, options)
      if(!template) template = initialTemplate
      template.Resources['BucketPolicy'] = defaults['BucketPolicy']
      template.Resources['RecordSet'] = defaults['RecordSet']
      if(overwrite) for(let key in stack) if(stack[key]) template.Resources[key] = defaults[key]
      else for(let key in stack) if(stack[key] && !template.Resources[key]) template.Resources[key] = templateDefaults[key]   
      let ResourcesToImport = []
      for(let resource in stack) if(importables[resource] && ResourceExists[resource](domain)) addToResources(ResourcesToImport, resource, ResourceExists[resource](domain), template.Resources[Resource].Type)
      if(options.https){
        //check if the certificate exists before
        template.Resources["AcmCertificate"] = AcmCertificate;
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
      resolve({"template":template, "existingResources": ResourcesToImport})
    }
  })
}