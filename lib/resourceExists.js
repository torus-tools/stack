//load files from the .env file
require('dotenv').config();
// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
var route53 = new AWS.Route53({apiVersion: '2013-04-01'});
var cloudfront = new AWS.CloudFront({apiVersion: '2019-03-26'});
var s3 = new AWS.S3({apiVersion: '2006-03-01'});
var acm = new AWS.ACM({apiVersion: '2015-12-08'});
//if the stack exists it should return an object. all objects must contain an ID field that contains the logical id of the resource + other properties

function CloudFrontDist(domainName) {
  return new Promise((resolve, reject) => {
    cloudfront.listDistributions({}).promise()
    .then(data=>{
      let items = data.DistributionList.Items
      let lastElem = items.length-1
      for(let i in items){
        if(items[i].Origins.Items[0].DomainName.startsWith(domainName)){
          let exists = items[i].Id
          resolve(exists)
        }
        if(i === lastElem.toString()) resolve(null)
      }
    }).catch(err=>reject(err))
  })  
}

function RootBucket(domain) {
  return new Promise((resolve, reject) => {
    var params = {Bucket: domain}
    s3.headBucket(params, function(err, data) {
      if (err) {
        if(err.code === 'NotFound' || err.code === 'Forbidden') resolve(false)
        else reject(err)
      } 
      else resolve({id:domain})
    });
  })
}

function HostedZone(domainName) {
  return new Promise((resolve, reject) => {
    var params = {"DNSName": domainName};
    route53.listHostedZonesByName(params, function(err, data) {
      if (err) reject(err.stack);
      else {
        let exists = null;
        if(data.HostedZones[0] && data.HostedZones[0].Name === domainName + '.') exists = data.HostedZones[0].Id.substr(data.HostedZones[0].Id.lastIndexOf('/')+1, data.HostedZones[0].Id.length);
        resolve({id:exists})
      }     
    })
  })
}

function AcmCertificate(domainName) {
  return new Promise((resolve, reject) => {
    var params = {CertificateStatuses: ['ISSUED']};
    acm.listCertificates(params).promise().then(data =>{
      for(c in data.CertificateSummaryList) {
        if(data.CertificateSummaryList[c].DomainName === domainName) resolve({id:data.CertificateSummaryList[c].CertificateArn})
        if(c >= data.CertificateSummaryList.length-1) resolve(null)
      }
    }).catch(err => reject(err))
  })
}

module.exports = {
  RootBucket,
  CloudFrontDist,
  HostedZone,
  AcmCertificate
}

// stackExists must be factored out into another file
// all other methods should be renamed according to the cloudformation resource names