//function that reads a cloudfomration template and deploys it
var AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});
var {stackExists} = require('./checkResource');

module.exports = function deployTemplate(domain, template, existingResources){
  let stackName = domain.replace('.', '') + 'Stack'
  if(existingResources && existingResources.length > 0) {
    console.log('STACKNAME', stackName)
    createChangeSet(stackName, template, existingResources, false, function(err, data){
      if(err) throw new Error(err)
      else {
        console.log('HEYYYYYYYYY YOOOOOO')
        console.log(data)
        createChangeSet(stackName, template, existingResources, true, function(err, data){
          if(err) throw new Error(err)
          else {
            console.log(data)
          }
        })
      }
    })
  }
  else{
    createChangeSet(stackName, template, existingResources, false, function(err, data){
      if(err) throw new Error(err)
      else {
        console.log(data)
      }
    })
  }
}  
      /* executeChangeSet(stackName, changeSetName, function(err, data){
        if(err) console.log(err)
        else {
          var params = {stackName: stackName};
          cloudformation.waitFor('stackExists', params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else {
              if(route53 && !hostedZoneExists(domain)){
                var params = {
                  LogicalResourceId: 'HostedZone',
                  StackName: stackName
                };
                cloudformation.describeStackResource(params, function(err, data) {
                  if (err) throw new Error(err.stack)
                  else {
                    var params = {Id: data.StackResourceDetail.PhysicalResourceId}
                    route53.waitFor('resourceRecordSetsChanged', params, function(err, data) {
                      if (err) console.log(err, err.stack);
                      else {
                        route53.getHostedZone(params, function(err, data) {
                          if (err) console.log(err, err.stack);
                          else {
                            let msg = 'In your Domain name registrar, please change your DNS settings to custom DNS and add the following Nameservers: \n' +  data.DelegationSet.NameServers;
                           console.log(msg)
                          }
                        });
                      }
                    });
                    //return stackArn;
                  }
                });
              }
            }
          });
          //when a route53 distribution is created the user must transfer the DNS
          
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
      })    
    }
  })        
} */


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


function createChangeSet(stackName, template, existingResources, importAction, callback){
  let dateobj = new Date();
  let dateString = dateobj.toString()
  let changeSetName = stackName + dateString.split("GMT")[0].split(' ').join('').replace(/:/g,'')
  stackExists(stackName).then((data) =>{
    console.log('DATAaaaaaaaaaa', data)
    let action = data ? 'UPDATE': 'CREATE';
    if(importAction) action = 'IMPORT';
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
      //RoleARN: 'STRING_VALUE',
    };
    if(importAction) params["ResourcesToImport"] = existingResources;
    params["TemplateBody"] = template;
    console.log(params)
    cloudformation.createChangeSet(params, function(err, data) {
      if (err) throw new Error(err.stack);
      else callback(null, data)
    })
  })
}