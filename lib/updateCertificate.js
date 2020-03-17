function getCertificateArn(stackName){
  var params = {
    LogicalResourceId: 'Certificate',
    StackName: stackName
  };
  cloudformation.describeStackResource(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
      console.log(data);
      console.log(data.StackResourceDetail);
      console.log(data.StackResourceDetail.PhysicalResourceId);
    }
  });
}

function describeCertificate(){
  var params = {
    CertificateArn: data.CertificateArn /* required */
  };
  acm.describeCertificate(params, function(err, data) {
    if (err) throw new Error(err);
    else {
      if(data.Certificate.DomainValidationOptions[0]){
        console.log(data);
        createCert(data)
      }
      else{
        let rawdata = fs.readFileSync('variables.json');
        obj = JSON.parse(rawdata);
        var params = {
          CertificateArn: obj.certificateArn /* required */
        };
        acm.describeCertificate(params, function(err, data) {
          if (err) {
            console.log(err, err.stack); // an error occurred
          }
          else {
            console.log(data);
            const cName = data.Certificate.DomainValidationOptions[0].ResourceRecord.Name;
            const cValue = data.Certificate.DomainValidationOptions[0].ResourceRecord.Value;
            createRecord(data);
          }
        });
      }
    }
  });  
}

function createRecord(cName, cValue, stackName) {
  console.log(cName);
  console.log(cValue);
  //get the hostedZone id
  var params = {
    LogicalResourceId: 'HostedZone',
    StackName: stackName
  };
  cloudformation.describeStackResource(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
      console.log(data);
      console.log(data.StackResourceDetail);
      console.log(data.StackResourceDetail.PhysicalResourceId);
      let hostedZone = data.StackResourceDetail.PhysicalResourceId;
      if(hostedZone){
        //create a CNAME record for the certificate in your route53 DNS
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
            console.log('Please wait for your certificate to be validated.')
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