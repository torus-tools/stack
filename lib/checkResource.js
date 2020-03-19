//load files from the .env file
require('dotenv').config();
// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});
var route53 = new AWS.Route53({apiVersion: '2013-04-01'});
var cloudfront = new AWS.CloudFront({apiVersion: '2019-03-26'});
var s3 = new AWS.S3({apiVersion: '2006-03-01'});

/* function checkDomain(domainName){
  if (/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(domainName)) return true;
  else return false;
} */

function stackExists(domainName, callback) {
  var params = {StackName: 'STRING_VALUE'};
  cloudformation.describeStacks(params, function(err, data) {
    if (err) console.log(err, err.stack);
    else {
      let exists = null;
      if(data.Stacks[0]){
        if(data.Stacks[0].StackName === StackName){
          exists = data.Stacks[0].StackId;
        }
        //console.log('You dont hosted zones for that domain.')
      }
      //console.log('You dont have any domain')
      return exists;
    }     
  });
}

function distributionExists(domainName, callback) {
    cloudfront.listDistributions({}, function(err, data) {
      if (err) throw new Error(err.stack);
      else {
        let exists = null;
        for(let item of data.DistributionList.Items){
          if(item.Origins.Items[0].DomainName.startsWith(domainName)){
            exists = item.Origins.Items[0].Id;
          }
        }
        console.log(exists)
        return exists;
      }
    });  
}

function bucketExists(domainName, callback) {
	var params = {
    Bucket: domainName
   };
   s3.getBucketPolicyStatus(params, function(err, data) {
    let exists = false
    if (err) {
      console.log(err.code)
      if(err.code === 'NoSuchBucket') console.log(exists)
      else throw new Error(err)
    }
    else {
      exists = true
      if(data.PolicyStatus.IsPublic) console.log("public")
      else console.log(exists)
    }
    return exists;
   });
};


function hostedZoneExists(domainName, callback) {
  var params = {
    "DNSName": domainName
  };
  route53.listHostedZonesByName(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
    }
    else {
      let exists = null;
      if(data.HostedZones[0]){
        if(data.HostedZones[0].Name === domainName + '.'){
          exists = data.HostedZones[0].Id;
        }
        //console.log('You dont hosted zones for that domain.')
      }
      //console.log('You dont have any domain')
      return exists;
    }     
  });
}

module.exports = {
  stackExists,
  bucketExists,
  distributionExists,
  hostedZoneExists
}