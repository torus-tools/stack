//function that reads a cloudfomration template and deploys it
var AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});
var stackExists = require('./stackExists');

function deployTemplate(domain, template, importAction){
  return new Promise((resolve, reject) => {
    var stackName = domain.split('.').join('') + 'Stack';
    //console.log('TEMPLATE ', template)
    createChangeSet(domain, stackName, template.template, template.existingResources, importAction)
    .then((changeSet) => {
      //console.log('CHANGESET ', changeSet)
      cloudformation.waitFor('changeSetCreateComplete', {ChangeSetName: changeSet.name, StackName: stackName}).promise()
      .then(()=> {
        cloudformation.executeChangeSet({ChangeSetName: changeSet.name, StackName: stackName}).promise()
        .then(data => {
          //console.log('EXECUTED CHANGESET ', data)
          let waitAction = 'stackCreateComplete'
          if(changeSet.action === 'UPDATE') waitAction = 'stackUpdateComplete'
          else if(changeSet.action === 'IMPORT') waitAction = 'stackImportComplete';
          cloudformation.waitFor(waitAction, {StackName: stackName}).promise()
          .then(() => resolve({stackName:stackName, changeSetName:changeSet.name, action:changeSet.action, template:JSON.parse(changeSet.template)}))
          .catch((err) => reject(err))
        }).catch((err) => reject(err))
      }).catch((err) => reject(err))
    }).catch((err) => reject(err))
  })
}

function createChangeSet(domain, stackName, template, existingResources, importAction){
  let dateString = new Date().toString()
  let changeSetName = stackName + dateString.split("GMT")[0].split(' ').join('').replace(/:/g,'')
  //console.log(JSON.stringify(template))
  return new Promise((resolve, reject) => {
    //console.log('STACKNAME ', stackName)
    stackExists(domain)
    .then((data) =>{
      //console.log('STACK EXISTS ', data)
      let action = data ? 'UPDATE': 'CREATE';
      let params = {
        ChangeSetName: changeSetName,
        StackName: stackName,
        Capabilities: ['CAPABILITY_NAMED_IAM'],
        ChangeSetType: action,
        TemplateBody: JSON.stringify(template)
      };
      //console.log(existingResources)
      if(importAction){
        let importTemplate = {
          "AWSTemplateFormatVersion": "2010-09-09",
          "Resources": {}    
        }
        for(elem of existingResources) importTemplate.Resources[elem['LogicalResourceId']] = template.Resources[elem['LogicalResourceId']]
        params.TemplateBody = JSON.stringify(importTemplate)
        params.ChangeSetType = 'IMPORT';
        params["ResourcesToImport"] = existingResources;
      }
      //console.log('PARAMS ', JSON.stringify(params))
      cloudformation.createChangeSet(params).promise()
      .then(()=> resolve({name:changeSetName, action:params.ChangeSetType, template: params.TemplateBody}))
      .catch((err)=> reject(err.stack))
    })
    .catch((err)=> reject(err))
  })
}

module.exports = {
  deployTemplate,
  createChangeSet
}



