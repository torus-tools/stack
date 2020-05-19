//function that reads a cloudfomration template and deploys it
var AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});
var {stackExists, hostedZoneExists} = require('./checkResource');
var acmCertificate = require('./acmCertificate');
var Route53 = new AWS.Route53({apiVersion: '2013-04-01'});

function deployStack(domain, template, existingResources, importAction, cdn, https, route53){
  return new Promise((resolve, reject) => {
    var stackName = domain.split('.').join('') + 'Stack';
    createChangeSet(stackName, template, existingResources, importAction)
    .then((changeSet) => {
      cloudformation.waitFor('changeSetCreateComplete', {ChangeSetName: changeSet.name, StackName: stackName}).promise()
      .then(()=> {
        console.log(changeSet.action)
        cloudformation.executeChangeSet({ChangeSetName: changeSet.name, StackName: stackName}).promise()
        .then(resolve({name:stackName, changeSet:changeSet.name, action:changeSet.action}))
        .catch((err) => reject(err))
      }).catch((err) => reject(err))
    })
    .catch((err) => reject(err))
  })
}

function createChangeSet(stackName, template, existingResources, importAction){
  let dateString = new Date().toString()
  let changeSetName = stackName + dateString.split("GMT")[0].split(' ').join('').replace(/:/g,'')
  console.log(changeSetName)
  return new Promise((resolve, reject) => {
    stackExists(stackName)
    .then((data) =>{
      let action = data ? 'UPDATE': 'CREATE';
      let params = {
        ChangeSetName: changeSetName,
        StackName: stackName,
        Capabilities: ['CAPABILITY_NAMED_IAM'],
        ChangeSetType: action,
        TemplateBody: JSON.stringify(template)
      };
      console.log(existingResources)
      if(importAction){
        params.ChangeSetType = 'IMPORT';
        params["ResourcesToImport"] = existingResources;
      }
      cloudformation.createChangeSet(params).promise()
      .then(()=> resolve({name:changeSetName, action:action}))
      .catch((err)=> reject(err.stack))
    })
    .catch((err)=> reject(err))
  })
}

module.exports = {
  deployStack,
  createChangeSet
}



