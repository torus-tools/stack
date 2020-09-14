function aws(domainName, recordName, recordType) {
  return new Promise((resolve, reject) => {
    hostedZoneExists(domainName).then((data) => {
      var params = {
        HostedZoneId: data, /* required */
        MaxItems: "1",
        StartRecordName: recordName,
        StartRecordType: recordType
      };
      route53.listResourceRecordSets(params).promise()
      .then(data => {
        if(data.ResourceRecordSets[0] && data.ResourceRecordSets[0].Name === recordName) resolve(true)
        else resolve(false)
      }).catch(err => reject(err))
    }).catch(err => reject(err))
  })
}