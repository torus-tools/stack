//function that reads a cloudfomration template and deploys it
var AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});
var {stackExists, hostedZoneExists} = require('./checkResource');
var acmCertificate = require('./acmCertificate');
var Route53 = new AWS.Route53({apiVersion: '2013-04-01'});

async function deployStack(domain, template, existingResources, cdn, https, route53){
  var stackName = domain.split('.').join('') + 'Stack';
  let changeSet = await createChangeSet(stackName, template, existingResources, false)
  cloudformation.waitFor('changeSetCreateComplete', {ChangeSetName: changeSet.name, StackName: stackName}).promise()
  .then(()=> {
    cloudformation.executeChangeSet({ChangeSetName: changeSet.name, StackName: stackName}).promise()
    .then(resolve({name:stackName, changeSet:changeSet.name, action:changeSet.action}))
    .catch((err) => console.log(err))
  }).catch((err) => console.log(err))
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
      if(importAction){
        action = 'IMPORT';
        params["ResourcesToImport"] = existingResources;
      }
      cloudformation.createChangeSet(params).promise()
      .then(()=> resolve({name:changeSetName, action:action}))
      .catch((err)=> reject(err.stack))
    })
    .catch((err)=> reject(err))
  })
}



/* function deployStack(domain, template, existingResources, cdn, https, route53){
  console.log(domain)
  var stackName = domain.split('.').join('') + 'Stack'
  //let hostedZone = hostedZoneExists(domain)
  createChangeSet(stackName, template, existingResources, false, function(err, data){
    console.log(stackName)
    if(err) throw new Error(err)
    else {
      var params = {ChangeSetName: data, StackName: stackName};
      cloudformation.waitFor('changeSetCreateComplete', params, function(err, data) {
        if(err) console.log(err)
        else {
          executeChangeSet(stackName, data.ChangeSetName, (err,data) => {
            console.log('STACK', stackName)
            if(err) throw new Error(err)
            else {
              //WAIT FOR THE BASIC STACK TO BE DEPLOYED
              let params = {StackName: stackName}
              cloudformation.waitFor('stackCreateComplete', params, function(err, data) {
                if (err) console.log(err, err.stack);
                else { 
                  newHostedZone(stackName, route53, cdn)
                  
                  
                  
                  if(https){
                    console.log('TRYING TO CREATE CERTIFICATE')
                    console.log(domain)
                    acmCertificate.createCertificate(domain, stackName, route53)
                    .then(()=>{
                      let resource = {
                        'LogicalResourceId': 'Certificate',
                        'ResourceIdentifier': {
                          '<ResourceIdentifierPropertyKey>': data,
                        },
                        'ResourceType': 'AWS::CertificateManager::Certificate'
                      }
                      existingResources.push(resource)
                      importResources(domain, stackName, template, existingResources, callback)
                    })
                  }
                  else {
                    importResources(domain, stackName, template, existingResources, callback)
                  }



                }
              });
            }
          })
        }
      });
    }
  })
} */

/* function executeChangeSet(stackName, changeSetName, callback){
  var params = {ChangeSetName: changeSetName, StackName: stackName};
  cloudformation.executeChangeSet(params).promise() 
} */



module.exports = {
  deployStack
}


