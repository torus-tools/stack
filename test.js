//load files from the .env file
require('dotenv').config();

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');

route53 = new AWS.Route53({apiVersion: '2013-04-01'});
var acm = new AWS.ACM({apiVersion: '2015-12-08'});

// interact with fs
const fs = require('fs');

let rawdata = fs.readFileSync('variables.json');
obj = JSON.parse(rawdata);

var params = {
  ChangeBatch: {
      Changes: [
          {
              Action: "CREATE", 
              ResourceRecordSet: {
                  Name: domain,
                  Type: 'A',
                  ResourceRecords: [],
                  AliasTarget:
                  { 
                      HostedZoneId: obj.hostedZoneId,
                      DNSName: obj.cloudFrontDomainName,
                      EvaluateTargetHealth: false 
                  }
              }
          }
      ], 
      Comment: `alias target for ${domain}`
  }, 
  HostedZoneId: obj.hostedZoneId
};
route53.changeResourceRecordSets(params, function(err, data) {
  if (err) {
      console.log(err, err.stack);
  }
  else {
      console.log(data);
      //CHANGE THE WWW RECORD SET
      var params = {
          ChangeBatch: {
              Changes: [
                  {
                      Action: "CREATE", 
                      ResourceRecordSet: {
                          Name: `www.${domain}`,
                          Type: 'A',
                          ResourceRecords: [],
                          AliasTarget:
                          { 
                              HostedZoneId: obj.hostedZoneId,
                              DNSName: obj.cloudFrontDomainName,
                              EvaluateTargetHealth: false 
                          }
                      }
                  }
              ], 
              Comment: `alias target for www.${domain}`
          }, 
          HostedZoneId: obj.hostedZoneId
      };
      route53.changeResourceRecordSets(params, function(err, data) {
          if (err) {
              console.log(err, err.stack);
          }
          else {
              console.log(data);
              console.log('succesfully changed the recordsets to point to cloudfront')
          }
      });
  }
});