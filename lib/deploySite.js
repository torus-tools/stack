var generateTemplate = require('../lib/generateTemplate');
var {deployStack} = require('../lib/deployStack');
var {createCertificate} = require('../lib/acmCertificate');
//var uploadSite = require('../lib/uploadSite')
var AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});
var Route53 = new AWS.Route53({apiVersion: '2013-04-01'});

module.exports = async function deploySite(domain, index, error, www, cdn, route53, https){
  let template = await generateTemplate(domain, index, error, www, false, route53, false)
  let stack = await deployStack(domain, template.template, template.existingResources, false, false, route53)
  let waitAction = 'stackCreateComplete'
  if(stack.action === 'UPDATE') waitAction = 'stackUpdateComplete';
  else if(stack.action === 'IMPORT') waitAction = 'stackImportComplete';
  let wait = await cloudformation.waitFor(waitAction, {StackName: stack.name}).promise()
  if(wait && stack.action === 'CREATE' && route53) newHostedZone(stack.name, route53, cdn)
  if(wait && https) {
    createCertificate(domain, stack.name, route53)
    .then(()=> {
      generateTemplate(domain, index, error, www, cdn, route53, https)
      .then((data)=> importCert(domain, data.template, data.existingResources, true))
      .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));
  }
  else if(wait && cdn){
    generateTemplate(domain, index, error, www, cdn, route53, https)
    .then((data)=> deployStack(domain, data.template, data.existingResources, false, false, route53))
    .catch((err) => console.log(err));
  }
}

function newHostedZone(stackName, route53, cdn){
  if(route53){
    var params = {
      LogicalResourceId: 'HostedZone',
      StackName: stackName
    };
    cloudformation.describeStackResource(params, function(err, data) {
      if (err) throw new Error(err.stack)
      else {
        var params = {Id: data.StackResourceDetail.PhysicalResourceId}
        Route53.getHostedZone(params, function(err, data) {
          if (err) console.log(err, err.stack);
          else console.log('In your Domain name registrar, please change your DNS settings to custom DNS and add the following Nameservers: \n' +  data.DelegationSet.NameServers);
        });
      }
    });
  } 
  else if(cdn) console.log('please create a CNAME record pointing to your distribution from the root. if you have mx records for your root domain this will interfere. please check out the docs for alternatives.');
}


function importCert(domain, template, existingResources, https){
  console.log(template)
  //add digital certificate to template
  if(https) {
    let Certificate = {
      "Type": "AWS::CertificateManager::Certificate",
      "Properties": {
        "DomainName" : domain,
        "DomainValidationOptions" : [ 
          {
            "DomainName": domain,
            "ValidationDomain": domain
          } 
        ],
        "SubjectAlternativeNames" : [ `*.${domain}` ],
        "ValidationMethod" : "DNS"
      }
    }
    template.Resources["Certificate"] = Certificate;
    template.Resources.CloudFrontDistribution.Properties.DistributionConfig["ViewerCertificate"] = {
      "AcmCertificateArn" : {"Ref": "Certificate"},
      "MinimumProtocolVersion" : "TLSv1.1_2016",
      "SslSupportMethod" : "sni-only"
    }
    template.Resources.CloudFrontDistribution.Properties.DistributionConfig["Aliases"] = [
      domain,
      `www.${domain}`
    ]
  }
  deployStack(domain, template, existingResources, false, false, route53)
}