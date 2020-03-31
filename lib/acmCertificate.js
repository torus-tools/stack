function getCertificateArn(stackName){
  var params = {
    LogicalResourceId: 'Certificate',
    StackName: stackName
  };
  cloudformation.describeStackResource(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
      console.log(data);
      console.log(data.StackResourceDetail.ResourceStatus);
      if(data.StackResourceDetail.ResourceStatus === 'CREATE_IN_PROGRESS'){
        //awssdk certificate.waitFor('CREATE_COMPLETE)
        //then callback
      }
      else {
        let arn = data.StackResourceDetail.PhysicalResourceId;
        if(arn){
          console.log(arn)
          callback(null, arn);
          //return arn;
        }
        else throw new Error('Error')
      }
    }
  });
}

function describeCertificate(certificateArn){
  var params = {
    CertificateArn: certificateArn
  };
  acm.describeCertificate(params, function(err, data) {
    if (err) throw new Error(err);
    else {
      if(data.Certificate.DomainValidationOptions[0]){
        const cName = data.Certificate.DomainValidationOptions[0].ResourceRecord.Name;
        const cValue = data.Certificate.DomainValidationOptions[0].ResourceRecord.Value;
        console.log(cName, cValue);
        callback(null, {"cname": cName, "cvalue": cValue});
        //return {"cname": cName, "cvalue": cValue};
      }
    }
  });  
}

function validateCertificate(cName, cValue, stackName) {
  console.log(cName);
  console.log(cValue);
  //get the hostedZone id
  var params = {
    LogicalResourceId: 'HostedZone',
    StackName: stackName
  };
  cloudformation.describeStackResource(params, function(err, data) {
    if (err) throw new Error(err);
    else {
      console.log(data);
      console.log(data.StackResourceDetail);
      console.log(data.StackResourceDetail.PhysicalResourceId);
      let hostedZone = data.StackResourceDetail.PhysicalResourceId;
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
        if (err) throw new Error(err.stack)
        else {
          callback(null, 'record for certificate created');
          //return 'cretificate created';
        }
      });
    }
  });
}