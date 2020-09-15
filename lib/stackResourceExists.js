require('dotenv').config();
var AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});

module.exports = function getStackResources(){
  var params = {StackName: 'torushostingStack'};
  cloudformation.describeStackResources(params).promise().then(data=>{
    let resources = {}
    for(let obj of data.StackResources) resources[obj.LogicalResourceId]=obj.PhysicalResourceId
    resolve(resources)
  }).catch(err=> console.log(err))
}