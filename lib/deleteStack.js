require('dotenv').config();
var AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});

module.exports = function deleteStack(stackName) {
  return new Promise((resolve, reject) => {
    var params = {StackName: stackName};
    cloudformation.deleteStack(params).promise()
    .then(() => resolve(stackName + ' cloudFormation Stack is being deleted.'))
    .catch((err) => reject(err))
  })
}