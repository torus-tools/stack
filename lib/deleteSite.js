require('dotenv').config();
var AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});

module.exports = function DeleteStack(stackName) {
  return new Promise((resolve, reject) => {
    var params = {StackName: stackName,};
    //deleteCert() then ..
    cloudformation.deleteStack(params).promise()
    .then(() => resolve(stackName + ' cloudFormation Stack is being deleted.'))
    .catch((err) => reject(err))
  })
}

function deleteCert(){
  //check if certificate exists; if it does delete it
  //check if route 53 record exists, if it does delete it.
  //if(cert && route) resolve(true)
}