//load files from the .env file
require('dotenv').config();
// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});
var route53 = new AWS.Route53({apiVersion: '2013-04-01'});
var cloudfront = new AWS.CloudFront({apiVersion: '2019-03-26'});
var s3 = new AWS.S3({apiVersion: '2006-03-01'});
var acm = new AWS.ACM({apiVersion: '2015-12-08'});

/* function checkDomain(domainName){
  if (/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(domainName)) return true;
  else return false;
} */

function stackExists(stackName) {
  return new Promise((resolve, reject) => {
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

function distributionExists(domainName) {
  return new Promise((resolve, reject) => {
    cloudfront.listDistributions({}, function(err, data) {
      if (err) reject(err)
      else {
        let items = data.DistributionList.Items
        let lastElem = items.length-1
        for(let i in items){
          //console.log(i, lastElem)
          if(items[i].Origins.Items[0].DomainName.startsWith(domainName)){
            let exists = {"id":items[i].Id, "domainName":items[i].DomainName}
            resolve(exists)
          }
          if(i === lastElem.toString()) resolve(null)
        }
      }
    })
  })  
}

function bucketExists(domainName) {
  return new Promise((resolve, reject) => {
    var params = {Bucket: domainName}
    s3.getBucketPolicyStatus(params, (err, data)=> {
      if(err) {
        if(err.code === 'NoSuchBucket') resolve(false)
        else if(err.code === 'NoSuchBucketPolicy') resolve(true)
        else reject(err)
      }
      else resolve(true);
        //if(data.PolicyStatus.IsPublic) console.log("bucket is already public")
        //else console.log("Error: bucket not public")
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

function newHostedZone(stackName){
  return new Promise((resolve, reject) => {
    var params = {
      LogicalResourceId: 'HostedZone',
      StackName: stackName
    };
    cloudformation.describeStackResource(params, (err, data) => {
      if (err) reject(err)
      else {
        var params = {Id: data.StackResourceDetail.PhysicalResourceId}
        route53.getHostedZone(params, (err, data) => {
          if (err) reject(err);
          else resolve(data.DelegationSet.NameServers);
        });
      }
    });
  });
}

function certificateExists(domainName) {
  return new Promise((resolve, reject) => {
    var params = {CertificateStatuses: ['ISSUED']};
    acm.listCertificates(params).promise().then(data =>{
      for(c in data.CertificateSummaryList) {
        if(data.CertificateSummaryList[c].DomainName === domainName) resolve(data.CertificateSummaryList[c].CertificateArn)
        if(c >= data.CertificateSummaryList.length-1) resolve(null)
      }
    }).catch(err => reject(err))
  })
}

function dnsRecordExists(domain, recordName, recordType) {
  return new Promise((resolve, reject) => {
    hostedZoneExists(domain).then((data) => {
      var params = {
        HostedZoneId: data, /* required */
        MaxItems: "1",
        StartRecordName: recordName,
        StartRecordType: recordType
      };
      route53.listResourceRecordSets(params).promise()
      .then(data => {
        if(data.ResourceRecordSets[0] && data.ResourceRecordSets[0].Name === recordName) resolve(true)
        else resolve(false)
      }).catch(err => reject(err))
    }).catch(err => reject(err))
  })
}

module.exports = {
  stackExists,
  bucketExists,
  distributionExists,
  certificateExists,
  dnsRecordExists,
  hostedZoneExists,
  newHostedZone
}