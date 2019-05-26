
//load files from the .env file
require('dotenv').config();

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');

route53 = new AWS.Route53({apiVersion: '2013-04-01'});
var acm = new AWS.ACM({apiVersion: '2015-12-08'});

// interact with fs
const fs = require('fs');

var domain = 'torusproject.org';

var params = {
  DomainName: `*.${domain}`, /* required */
  DomainValidationOptions: [
    {
      DomainName: domain,
      ValidationDomain: domain,
    },
  ],
  //IdempotencyToken: 'STRING_VALUE',
  //Options: {
  //  CertificateTransparencyLoggingPreference: ENABLED | DISABLED
  //},
  SubjectAlternativeNames: [
    domain,
  ],
  ValidationMethod: 'DNS'
};
acm.requestCertificate(params, function(err, data) {
  if (err) {
    console.log(err, err.stack); // an error occurred
  } 
  else {
    console.log(data.CertificateArn);
    var params = {
      CertificateArn: data.CertificateArn /* required */
    };
    acm.describeCertificate(params, function(err, data) {
      if (err) {
        console.log(err, err.stack); // an error occurred
      }
      else {
        const cName = data.Certificate.DomainValidationOptions[0].ResourceRecord.Name;
        const cValue = data.Certificate.DomainValidationOptions[0].ResourceRecord.Value;
        console.log(cName);
        console.log(cValue);
        let rawdata = fs.readFileSync('variables.json');
        obj = JSON.parse(rawdata);
        var hostedZone = obj.hostedZoneId;
        //route 53 add CNAME record
        var params = {
          ChangeBatch: {
           Changes: [
              {
             Action: "CREATE", 
             ResourceRecordSet: {
              Name: cName, 
              ResourceRecords: [
                 {
                Value: cValue
               }
              ], 
              TTL: 300, 
              Type: "CNAME"
             }
            }
           ], 
           Comment: "CNAME record for the AWS ACM certificate"
          }, 
          HostedZoneId: hostedZone
         };
         route53.changeResourceRecordSets(params, function(err, data) {
           if (err) {
            console.log(err, err.stack); // an error occurred
           } 
           else {
             console.log(data); // successful response
             console.log('succesfully created the certificate.')
           }
         });
      }            
    });
  }
});

