require('dotenv').config();
var AWS = require('aws-sdk');
var {certificateExists, dnsRecordExists} = require('./checkResource');
var {describeCertificate} = require('./acmCertificate');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});
var acm = new AWS.ACM({apiVersion: '2015-12-08'});

module.exports = function DeleteStack(stackName, domain) {
  return new Promise((resolve, reject) => {
    var params = {StackName: stackName};
    deleteCert(domain).then(() => {
      cloudformation.deleteStack(params).promise()
      .then(() => resolve(stackName + ' cloudFormation Stack is being deleted.'))
      .catch((err) => reject(err))
    }).catch((err) => reject(err))
  })
}

function deleteCert(domain){
  return new Promise(async (resolve, reject) => {
    //check if certificate exists; if it does delete it
    let cert = await certificateExists(domain).catch(err => reject(err))
    let certData = await describeCertificate(cert).catch(err => reject(err))
    let delCert = false;
    let delRoute = false;
    if(cert) delCert = acm.deleteCertificate({CertificateArn: 'STRING_VALUE'}).catch(err => reject(err))
    else delCert = true;
    let recordSet = await dnsRecordExists(domain, certData.cName, "CNAME").catch(err => reject(err))
    var params = {
      ChangeBatch: {
        Changes: [
          {
            Action: "DELETE", 
            ResourceRecordSet: {
              Name: certData.cName, 
              ResourceRecords: [
                {
                  Value: certData.cValue
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
    if(recordSet) delRoute = Route53.changeResourceRecordSets(params).promise().catch(err => reject(err))
    else delRoute = true;
    if(cert && route) resolve(true);
  })
}