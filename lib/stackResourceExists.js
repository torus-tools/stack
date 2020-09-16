require('dotenv').config();
var AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});

module.exports = function getStackResources(domain){
  return new Promise((resolve, reject)=> {
    let stackName = domain.split('.').join('') + 'Stack'
    var params = {StackName: stackName};
    cloudformation.describeStackResources(params).promise().then(data=>{
      let resources = {}
      for(let obj of data.StackResources) resources[obj.LogicalResourceId]=obj.PhysicalResourceId
      resolve(resources)
    }).catch(err=> reject(err))
  })
}