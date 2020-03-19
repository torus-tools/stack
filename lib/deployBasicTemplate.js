//function that reads a cloudfomration template and deploys it
var AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});
var {checkStack} = require('./checkResource');

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
  //execute changeSet
  /* cloudformation.createStack(params, function(err, data) {
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
  }); */
}


function executeChangeSet(){
  var params = {
    ChangeSetName: 'STRING_VALUE', /* required */
    ClientRequestToken: 'STRING_VALUE',
    StackName: 'STRING_VALUE'
  };
  cloudformation.executeChangeSet(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
      console.log(data);
      //if route53 && !hostedZoneExists console log change the nameservers in your account
      //if https 
        //if route53 create the records automatically
        //else console log create the records manually
    }
  });
}


function createChangeSet(stackName){
  let dateobj = new Date();
  let dateString = dateobj.toString()
  let changeSetName = stackName + dateString.split("GMT")[0].split(' ').join('').replace(/:/g,'')
  //check stack
  let action = checkStack() ? 'UPDATE': 'CREATE';
  var params = {
    ChangeSetName: changeSetName,
    StackName: stackName, /* required */
    Capabilities: [
      'CAPABILITY_NAMED_IAM'
    ],
    ChangeSetType: action,
    ClientToken: 'STRING_VALUE',
    Description: 'STRING_VALUE',
    NotificationARNs: [
      'STRING_VALUE',
      /* more items */
    ],
    Parameters: [
      {
        ParameterKey: 'STRING_VALUE',
        ParameterValue: 'STRING_VALUE',
        ResolvedValue: 'STRING_VALUE',
        UsePreviousValue: true || false
      },
      /* more items */
    ],
    ResourceTypes: [
      'STRING_VALUE',
      /* more items */
    ],
    ResourcesToImport: [
      {
        LogicalResourceId: 'STRING_VALUE', /* required */
        ResourceIdentifier: { /* required */
          '<ResourceIdentifierPropertyKey>': 'STRING_VALUE',
          /* '<ResourceIdentifierPropertyKey>': ... */
        },
        ResourceType: 'STRING_VALUE' /* required */
      },
      /* more items */
    ],
    RoleARN: 'STRING_VALUE',
    RollbackConfiguration: {
      MonitoringTimeInMinutes: 'NUMBER_VALUE',
      RollbackTriggers: [
        {
          Arn: 'STRING_VALUE', /* required */
          Type: 'STRING_VALUE' /* required */
        },
        /* more items */
      ]
    },
    Tags: [
      {
        Key: 'STRING_VALUE', /* required */
        Value: 'STRING_VALUE' /* required */
      },
      /* more items */
    ],
    TemplateBody: 'STRING_VALUE',
    TemplateURL: 'STRING_VALUE',
    UsePreviousTemplate: true || false
  };
  cloudformation.createChangeSet(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  });
}