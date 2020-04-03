//function that reads a cloudfomration template and deploys it
var AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});

module.exports = function deployTemplate(domain, template){
  let stackName = domain.replace('.', '') + 'Stack4'
	var params = {
    StackName: stackName,
    TemplateBody: template,
    TimeoutInMinutes: 5,
    Capabilities: [
      "CAPABILITY_NAMED_IAM"
    ]
  };
  //if stack exists execute changeset
  //else
  cloudformation.createStack(params, function(err, data) {
    if (err) throw new Error(err)
    else {
      var stackArn = data.StackId;
      //FormConfig.AddVar(siteName, "stackId", stackArn);
      var params = {
        StackName: stackArn
      };
      cloudformation.waitFor('stackCreateComplete', params, function(err, data) {
        if(err) throw new Error(err);
        else {
          var params = {
            LogicalResourceId: 'HostedZone',
            StackName: stackArn
          };
          cloudformation.describeStackResource(params, function(err, data) {
            if (err) throw new Error(err.stack)
            else {
              var params = {Id: data.StackResourceDetail.PhysicalResourceId};
               route53.getHostedZone(params, function(err, data) {
                 if (err) console.log(err, err.stack); // an error occurred
                 else {
                   let msg = 'In your Domain name registrar, please change your DNS settings to custom DNS and add the following Nameservers: \n' +  data.DelegationSet.NameServers;
                  console.log(msg)
                 }
               });
              return stackArn;
            }
          });
        }
      });
    }    
  });
}