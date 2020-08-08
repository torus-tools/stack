//function that reads a cloudfomration template and deploys it
var AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});
var stackExists = require('./stackExists');

function deployTemplate(domain, template, importAction){
  return new Promise((resolve, reject) => {
    var stackName = domain.split('.').join('') + 'Stack';
    createChangeSet(stackName, template.template, template.existingResources, importAction)
    .then((changeSet) => {
      cloudformation.waitFor('changeSetCreateComplete', {ChangeSetName: changeSet.name, StackName: stackName}).promise()
      .then(()=> {
        //console.log(changeSet.action)
        cloudformation.executeChangeSet({ChangeSetName: changeSet.name, StackName: stackName}).promise()
        .then(resolve({stackName:stackName, changeSetName:changeSet.name, action:changeSet.action}))
        .catch((err) => reject(err))
      }).catch((err) => reject(err))
    })
    .catch((err) => reject(err))
  })
}

function createChangeSet(stackName, template, existingResources, importAction){
  let dateString = new Date().toString()
  let changeSetName = stackName + dateString.split("GMT")[0].split(' ').join('').replace(/:/g,'')
  console.log(JSON.stringify(template))
  return new Promise((resolve, reject) => {
    stackExists.aws(stackName)
    .then((data) =>{
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
  deployTemplate,
  createChangeSet
}



