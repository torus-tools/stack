//load files from the .env file
require('dotenv').config();

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');

var acm = new AWS.ACM({apiVersion: '2015-12-08'});
route53 = new AWS.Route53({apiVersion: '2013-04-01'});

// interact with fs
const fs = require('fs');

//import general functions
var addVars = require('./general');
//var getHostedZoneId = require('./get-hosted-zone');

exports.script = function getCert(domain) {
  var params = {
    DomainName: domain, /* required */
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
      `*.${domain}`,
    ],
    ValidationMethod: 'DNS'
  };
  acm.requestCertificate(params, function(err, data) {
    if (err) {
      console.log(err, err.stack); // an error occurred
    } 
    else {
      console.log(data);
      console.log(data.CertificateArn);
      addVars.script('certificateArn', data.CertificateArn);
      var params = {
        CertificateArn: data.CertificateArn /* required */
      };
      acm.describeCertificate(params, function(err, data) {
        if (err) {
          console.log(err, err.stack); // an error occurred
        }
        else {

          // INSERT IMPLICIT WAIT FOR 5 SECONDS

          const cName = data.Certificate.DomainValidationOptions[0].ResourceRecord.Name;
          const cValue = data.Certificate.DomainValidationOptions[0].ResourceRecord.Value;
          console.log(cName);
          console.log(cValue);
          let rawdata = fs.readFileSync('variables.json');
          obj = JSON.parse(rawdata);
          if(obj.hostedZoneId){
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
                // WAIT FOR CERTIFICATE TO BE VALIDATED
                var params = {
                  CertificateArn: obj.certificateArn /* required */
                };
                acm.waitFor('certificateValidated', params, function(err, data) {
                  if (err) {
                    console.log(err, err.stack); // an error occurred
                  }
                  else { 
                    console.log(data);
                    console.log('certificate validated')
                    // GET THE CERTIFICATE
                    var params = {
                      CertificateArn: obj.certificateArn /* required */
                    };
                    acm.describeCertificate(params, function(err, data) {
                      if (err) {
                        console.log(err, err.stack); // an error occurred
                      }
                      else {
                        console.log(data);
                        }
                    });
                  }           
                });
              }
            });
          }
          else {
            console.log('There was an error. please try again.')
          } 
        }           
      });    
    }
  });  
}
