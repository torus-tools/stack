var AWS = require('aws-sdk');
var route53 = new AWS.Route53({apiVersion: '2014-05-15'});

//AWS
function aws(domain){
  return new Promise((resolve, reject) => {
    var params = {"DNSName": domain};
    route53.listHostedZonesByName(params).promise()
    .then(data => {
      if(data.HostedZones[0]) {
        if(data.HostedZones[0].Name === domain + '.') resolve(data.HostedZones[0].Id)
        else reject('no hosted zones exist for the given domain')
      }
      else reject('no hosted zones')
    })
    .catch(err => reject(err))
  })
}

module.exports = {
  aws
}