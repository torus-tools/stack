var AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});

module.exports = function aws(domain) {
  return new Promise((resolve, reject) => {
    // get stackname from domain
    let stackName = domain.split('.').join('') + 'Stack'
    var params = {StackName: stackName};
    cloudformation.describeStacks(params, function(err, data) {
      if (err) {
        //console.log('MESSAGE', err.message)
        if(err.message === `Stack with id ${stackName} does not exist` || err.message === `Stack with id [${stackName}] does not exist`) resolve(null)
        else reject(err)
      }
      else if(data.Stacks[0] && data.Stacks[0].StackName === stackName){
        if(data.Stacks[0].StackStatus !== 'REVIEW_IN_PROGRESS') resolve(data.Stacks[0].StackId)
        else resolve(null) 
      } 
      else resolve(null)
    })
  })
}
