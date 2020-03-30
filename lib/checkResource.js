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

function distributionExists(domainName) {
  return new Promise((resolve, reject) => {
    cloudfront.listDistributions({}, function(err, data) {
      if (err) reject(err)
      else {
        let items = data.DistributionList.Items
        for(let i in items){
          if(items[i].Origins.Items[0].DomainName.startsWith(domainName)){
            let exists = {"id":items[i].Id, "domainName":items[i].DomainName}
            resolve(exists)
          }
          else if(i === data.DistributionList.Items.length -1) resolve(null)
        }
      }
    })
  })  
}

function bucketExists(domainName) {
  return new Promise((resolve, reject) => {
    var params = {Bucket: domainName}
    s3.getBucketPolicyStatus(params, function(err, data) {
      if(err) {
        if(err.code === 'NoSuchBucket') resolve(false)
        else if(err.code === 'NoSuchBucketPolicy') resolve(true)
        else reject(err)
      }
      else {
        if(data.PolicyStatus.IsPublic) console.log("bucket is already public")
        else console.log("Error: bucket not public")
        resolve(true)
      }
    })
  })
}


function hostedZoneExists(domainName) {
  return new Promise((resolve, reject) => {
    var params = {"DNSName": domainName};
    route53.listHostedZonesByName(params, function(err, data) {
      if (err) reject(err.stack);
      else {
        let exists = null;
        if(data.HostedZones[0]){
          if(data.HostedZones[0].Name === domainName + '.') exists = data.HostedZones[0].Id;
        }
        resolve(exists)
      }     
    })
  })
}

module.exports = {
  stackExists,
  bucketExists,
  distributionExists,
  hostedZoneExists
}