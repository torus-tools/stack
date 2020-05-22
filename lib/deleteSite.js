require('dotenv').config();
var AWS = require('aws-sdk');
var {certificateExists, dnsRecordExists, hostedZoneExists} = require('./checkResource');
var {describeCertificate} = require('./acmCertificate');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});
var acm = new AWS.ACM({apiVersion: '2015-12-08'});

function DeleteStack(stackName) {
  return new Promise((resolve, reject) => {
    var params = {StackName: stackName};
    cloudformation.deleteStack(params).promise()
    .then(() => resolve(stackName + ' cloudFormation Stack is being deleted.'))
    .catch((err) => reject(err))
  })
}

function DeleteCert(domain){
  return new Promise(async (resolve, reject) => {
    let delCert = false;
    let delRoute = false;
    let cert = await certificateExists(domain).catch(err => reject(err))
    let hostedZone = await hostedZoneExists(domain).catch(err => reject(err))
    //console.log(cert)
    if(cert){
      let certData = await describeCertificate(cert).catch(err => reject(err))
      //console.log(certData)
      if(cert) delCert = acm.deleteCertificate({CertificateArn: cert}).promise().catch(err => reject(err))
      else delCert = true;
      let recordSet = await dnsRecordExists(domain, certData.cName, "CNAME").catch(err => reject(err))
      console.log(recordSet)
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
          ]
        }, 
        HostedZoneId: hostedZone
      };
      if(recordSet){
        delRoute = await Route53.changeResourceRecordSets(params).promise().catch(err => reject(err))
        console.log(delRoute)
      }
      else delRoute = true;
      if(delCert && delRoute) resolve(true);
    }
    else resolve(false)
  })
}

module.exports = {
  DeleteStack,
  DeleteCert
}