require('dotenv').config();
var AWS = require('aws-sdk');
var {dnsRecordExists} = require('./existingResources/aws');
var acm = new AWS.ACM({apiVersion: '2015-12-08'});
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});
var Route53 = new AWS.Route53({apiVersion: '2013-04-01'});

function requestCertificate(domain){
  return new Promise((resolve, reject) => {
    var params = {
      DomainName: domain, /* required */
      DomainValidationOptions: [
        {
          DomainName: domain,
          ValidationDomain: domain,
        },
      ],
      SubjectAlternativeNames: [
        `*.${domain}`,
      ],
      ValidationMethod: 'DNS'
    };
    acm.requestCertificate(params, function(err, data) {
      if (err) reject(err)
      else {
        //console.log('CERTFICATE ARN DATA', data);
        //console.log(data.CertificateArn);
        resolve(data.CertificateArn)  
      }
    });
  })
}

function describeCertificate(certificateArn){
  return new Promise((resolve, reject) => {
    var params = {CertificateArn: certificateArn};
    acm.describeCertificate(params, async (err, data) => {
      if (err) reject(err);
      else {
        //console.log(JSON.stringify(data))
        let response = data;
        while(!response.Certificate.DomainValidationOptions || !response.Certificate.DomainValidationOptions[0].ResourceRecord) {
          //console.log('describing ...')
          response = await acm.describeCertificate(params).promise()
          //console.log(JSON.stringify(response))
        }
        if(response.Certificate.DomainValidationOptions[0].ResourceRecord){
          let cName = response.Certificate.DomainValidationOptions[0].ResourceRecord.Name;
          let cValue = response.Certificate.DomainValidationOptions[0].ResourceRecord.Value;
          //console.log('CNAME   ', cName, cValue);
         resolve({"cName": cName, "cValue": cValue});
        }
      }
    });
  })  
}

function validateCertificate(cName, cValue, stackName) {
  return new Promise((resolve, reject) => {
    var params = {
      LogicalResourceId: 'HostedZone',
      StackName: stackName
    };
    cloudformation.describeStackResource(params, function(err, data) {
      if (err) reject(err);
      else {
        //console.log('HOSTEDZONE RESOURCE DATA', data);
        //console.log(data.StackResourceDetail);
        //console.log(data.StackResourceDetail.PhysicalResourceId);
        //create a CNAME record for the certificate in your route53 DNS
        let hostedZone = data.StackResourceDetail.PhysicalResourceId;
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
            Comment: "create CNAME record for the AWS ACM certificate"
          }, 
          HostedZoneId: hostedZone
        };
        //console.log('PARAMS \n', JSON.stringify(params))
        Route53.changeResourceRecordSets(params, function(err, data) {
          if (err) reject(err.stack)
          else resolve('record for certificate created');
        });
      }
    });
  })
}

function requestAndValidateCertificate(domain, stackName, route53){
  return new Promise((resolve, reject) => {
    //requestCertificate(domain)
    //.then((arn) => {
      requestCertificate(domain)
      .then((arn) => {
        const Arn = arn;
        describeCertificate(Arn)
        .then((data) => {
          // CHECK FOR EXISTING RECORD BEFORE
          if(route53) {
            dnsRecordExists(domain, data.cName, "CNAME").then(exists => {
              if(exists) resolve(Arn)
              else {
                validateCertificate(data.cName, data.cValue, stackName)
                .then(() =>{resolve(Arn)})
                .catch((err)=>{reject(err)})  
              }
            })
          }
          else{
            let msg = 
            `
            please create a CNAME record for the certficate in your domains DNS with the following vallues:\n
            name or host: ${data.cName}\n
            value or points to: ${data.cValue}\n
            `
            console.log(msg)
            resolve(Arn);
          }
        }).catch((err)=>{reject(err)})
      }).catch((err)=>{reject(err)})
    //}).catch((err)=>{reject(err)})
  })
}

module.exports = {
  requestCertificate,
  describeCertificate,
  validateCertificate,
  requestAndValidateCertificate,
}
