var AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});

module.exports = function aws(domain) {
  return new Promise((resolve, reject) => {
    let stackName = domain.split('.').join('') + 'Stack'
    cloudformation.describeStacks({StackName: stackName}).promise().then(data => {
      if(data.Stacks[0] && data.Stacks[0].StackName === stackName){
        if(data.Stacks[0].StackStatus !== 'REVIEW_IN_PROGRESS') resolve(data.Stacks[0].StackId)
        else resolve(null) 
      } 
      else resolve(null)
    }).catch(err => {
      if(err.message === `Stack with id ${stackName} does not exist` || err.message === `Stack with id [${stackName}] does not exist`) resolve(null)
      else reject(err)
    })
  })
}
