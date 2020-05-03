//function that reads a cloudfomration template and deploys it
var AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});
var {checkStack} = require('./checkResource');

module.exports = function deployTemplate(domain, template, existingResources, ){
  let stackName = domain.replace('.', '') + 'Stack'
  createChangeSet(stackName, template, existingResources, function(err, data){
    if(err) throw new Error(err)
    else {
      console.log(data)
      /* executeChangeSet(stackName, changeSetName, function(err, data){
        if(err) console.log(err)
        else {
          //when a route53 distribution is created the user must transfer the DNS
          if(route53 && !hostedZoneExists(domain)){
            //first wait for hosted zone creation complete
            //then
            var params = {
              LogicalResourceId: 'HostedZone',
              StackName: stackName
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
          //if https waitfor resourceComplete certificate
            //then get the id of the certificate and retrieve the certificates CNAME records
            //if (route53) create record for certificate
            //else console.log(please create a CNAME record with the following name and value)
    
          //if cdn && !route53
            //if the distribution doesnt exists if !
              //console.log(please create a CNAME record pointing to your distribution from the root. if you have mx records for your root domain this will interfere. please check out the docs for alternatives.)
          
          //always wait for stack creation complete then output all done!
          var stackArn = data.StackId;
          var params = {
            StackName: stackArn
          };
          cloudformation.waitFor('stackCreateComplete', params, function(err, data) {
            if(err) throw new Error(err);
            else(console.log('All Done!'))
          })
        }
      }) */
    }
  })        
}


function executeChangeSet(stackName, changeSetName, callback){
  var params = {
    ChangeSetName: changeSetName, /* required */
    StackName: stackName
  };
  cloudformation.executeChangeSet(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
      callback(null, data)
    }
  });
}


function createChangeSet(stackName, template, existingResources, callback){
  let dateobj = new Date();
  let dateString = dateobj.toString()
  let changeSetName = stackName + dateString.split("GMT")[0].split(' ').join('').replace(/:/g,'')
  let action = checkStack() ? 'UPDATE': 'CREATE';
  var params = {
    ChangeSetName: changeSetName,
    StackName: stackName,
    Capabilities: [
      'CAPABILITY_NAMED_IAM'
    ],
    ChangeSetType: action,
    //Description: 'STRING_VALUE',
    /* 
    ResourceTypes: [
      'STRING_VALUE',
    ], 
    */
    ResourcesToImport: existingResources, 
    //RoleARN: 'STRING_VALUE',
    TemplateBody: TemplateBody
  };
  cloudformation.createChangeSet(params, function(err, data) {
    if (err) throw new Error(err.stack);
    else callback(null, data)
  });
}