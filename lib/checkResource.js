//load files from the .env file
require('dotenv').config();
// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
var route53 = new AWS.Route53({apiVersion: '2013-04-01'});
var cloudfront = new AWS.CloudFront({apiVersion: '2019-03-26'});
var s3 = new AWS.S3({apiVersion: '2006-03-01'});

function checkDomain(domainName){
  if (/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(domainName)) return true;
  else return false;
}

function distributionExists(domainName, callback) {
    cloudfront.listDistributions({}, function(err, data) {
      if (err) throw new Error(err.stack);
      else {
        let exists = false
        for(let item of data.DistributionList.Items){
          if(item.Origins.Items[0].DomainName.startsWith(domainName)){
            exists = true;
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
   s3.getBucketCors(params, function(err, data) {
     if (err) console.log(err, err.stack); // an error occurred
     else     console.log(data);           // successful response
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
      let exists = false;
      if(data.HostedZones[0]){
        if(data.HostedZones[0].Name === domainName + '.'){
          exists = true;
          var str = data.HostedZones[0].Id
          return str
        }
        console.log('Error: you dont hosted zones for that domain.')
      }
      console.log('Error: you dont have any domain')
    }     
  });
}

bucketExists("tradexauto.com")

module.exports = {
  bucketExists,
  distributionExists,
  hostedZoneExists
}