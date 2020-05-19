require('dotenv').config();
var generateTemplate = require('../lib/generateTemplate');
var {deployStack} = require('../lib/deployStack');
var {createCertificate} = require('../lib/acmCertificate');
var {stackExists, newHostedZone} = require('./checkResource');
var {uploadDir} = require('./upload')
//var uploadSite = require('../lib/uploadSite')
var AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});
var acm = new AWS.ACM({apiVersion: '2015-12-08'});

module.exports = async function deploySite(domain, index, error, www, cdn, route53, https){
  let newTemplate = await generateTemplate(domain, index, error, www, cdn, route53, https)
  let temp = {TemplateBody:{}};
  let stackName = domain.split('.').join('') + 'Stack'
  let stackId = await stackExists(stackName)
  if(stackId) temp = await cloudformation.getTemplate({StackName: stackId}).promise()
  //console.log('\n\n', template.template)
  //console.log(JSON.parse(temp.TemplateBody))
  if(temp.TemplateBody === JSON.stringify(newTemplate.template)) {
    if(https) {
      let certArn = await createCertificate(domain, stackName, route53)
      let wait = await acm.waitFor('certificateValidated', {CertificateArn:certArn}).promise().catch((err) => console.log(err))
      if(wait && cdn){
        let data = await generateTemplate(domain, index, error, www, cdn, route53, arn).catch((err) => console.log(err))
        await deployStack(domain, data.template, data.existingResources, false, false, false, route53)
        .then(() => console.log('Creating your cloudfront distribution. This might take a while to reflect the HTTPS... In the meantime your site is already functional without HTTPS.'))
        .catch((err) => console.log(err));
      }
    }
    else if(cdn && !https){
      generateTemplate(domain, index, error, www, cdn, route53, https)
      .then((data)=> deployStack(domain, data.template, data.existingResources, false, false, false, route53))
      .catch((err) => console.log(err));
    }
    else console.log('No changes detected...')
  }
  else {
    let template = await generateTemplate(domain, index, error, www, false, route53, false)
    let stack = await deployStack(domain, template.template, template.existingResources, false, false, false, route53)
    let waitAction = 'stackCreateComplete'
    if(stack.action === 'UPDATE') waitAction = 'stackUpdateComplete';
    else if(stack.action === 'IMPORT') waitAction = 'stackImportComplete';
    let wait = await cloudformation.waitFor(waitAction, {StackName: stack.name}).promise()
    if(wait) console.log('uploadDir()')
    if(wait && stack.action === 'CREATE') {
      if(route53){
        newHostedZone(stack.name).then(data => console.log(data)).catch(err => console.log(err))
        wait = await delay(3000)
      }
      else console.log('you can access your test site at the following url ...')
      //need to write a function to get the propper url of the s3 bucket
    }
    if(wait && https) {
      let certArn = await createCertificate(domain, stackName, route53)
      let wait = await acm.waitFor('certificateValidated', {CertificateArn:certArn}).promise().catch((err) => console.log(err))
      if(wait && cdn){
        let data = await generateTemplate(domain, index, error, www, cdn, route53, arn).catch((err) => console.log(err))
        await deployStack(domain, data.template, data.existingResources, false, false, false, route53)
        .then(() => console.log('Creating your cloudfront distribution. This might take a while to reflect the HTTPS... In the meantime your site is already functional without HTTPS.'))
        .catch((err) => console.log(err));
      }
    }
    else if(wait && cdn && !https){
      generateTemplate(domain, index, error, www, cdn, route53, https)
      .then((data)=> deployStack(domain, data.template, data.existingResources, false, false, false, route53))
      .catch((err) => console.log(err));
    }
  }
}

function delay(ms){
  return new Promise((resolve) => {
    setTimeout(resolve(true), ms)
  })
}