require('dotenv').config();
var generateTemplate = require('../lib/generateTemplate');
var {deployStack} = require('../lib/deployStack');
var {createCertificate} = require('../lib/acmCertificate');
var {stackExists} = require('./checkResource');
//var uploadSite = require('../lib/uploadSite')
var AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});
var Route53 = new AWS.Route53({apiVersion: '2013-04-01'});

module.exports = async function deploySite(domain, index, error, www, cdn, route53, https){
  let template = await generateTemplate(domain, index, error, www, false, route53, false)
  let temp = {TemplateBody:{}};
  let stackName = domain.split('.').join('') + 'Stack'
  let stackId = await stackExists(stackName)
  if(stackId) temp = await cloudformation.getTemplate({StackName: stackId}).promise()
  //console.log('\n\n', template.template)
  //console.log(JSON.parse(temp.TemplateBody))
  if(temp.TemplateBody === JSON.stringify(template.template)) {
    console.log('No changes detected...')
    if(https) {
      createCertificate(domain, stackName, route53)
      //WAIT FOR CERTIFICATE VALIDATED
      .then((arn)=> {
        console.log('Certificate created with ARN: '+ arn);
        if(cdn){
          generateTemplate(domain, index, error, www, cdn, route53, arn)
          .then((data)=> deployStack(domain, data.template, data.existingResources, false, false, false, route53))
          .then(()=>console.log('Creating your cloudfront distribution. This might take a while to reflect the HTTPS... In the meantime your site is already functional without HTTPS.'))
          .catch((err) => console.log(err));
        }
      }).catch((err) => console.log(err));
    }
    else if(cdn && !https){
      generateTemplate(domain, index, error, www, cdn, route53, https)
      .then((data)=> deployStack(domain, data.template, data.existingResources, false, false, false, route53))
      .catch((err) => console.log(err));
    }
  }
  else {
    let stack = await deployStack(domain, template.template, template.existingResources, false, false, false, route53)
    let waitAction = 'stackCreateComplete'
    if(stack.action === 'UPDATE') waitAction = 'stackUpdateComplete';
    else if(stack.action === 'IMPORT') waitAction = 'stackImportComplete';
    let wait = await cloudformation.waitFor(waitAction, {StackName: stack.name}).promise()
    if(wait && stack.action === 'CREATE' && route53) newHostedZone(stack.name, route53, cdn)
    //upload files
    //then return the site URL
    if(wait && https) {
      console.log(https)
      createCertificate(domain, stackName, route53)
      .then((arn)=> {
        console.log('Certificate created with ARN: '+ arn);
        if(cdn){
          generateTemplate(domain, index, error, www, cdn, route53, arn)
          .then((data)=> deployStack(domain, data.template, data.existingResources, false, false, false, route53))
          .then(()=>console.log('Creating your cloudfront distribution. This might take a while... In the meantime your site is already active.'))
          .catch((err) => console.log(err));
        }
      }).catch((err) => console.log(err));
    }
    else if(wait && cdn && !https){
      generateTemplate(domain, index, error, www, cdn, route53, https)
      .then((data)=> deployStack(domain, data.template, data.existingResources, false, false, false, route53))
      .catch((err) => console.log(err));
    }
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

function delay(ms){
  return new Promise((resolve) => {
    setTimeout(resolve(true), ms)
  })
}