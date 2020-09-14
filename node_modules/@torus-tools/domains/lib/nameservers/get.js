require('dotenv').config()
var AWS = require('aws-sdk');
var route53 = new AWS.Route53({apiVersion: '2014-05-15'});
const axios = require('axios');

//domain must be a string that is a valid domain name
//nameservers must be an array of strings that are valid nameservers

//AWS
function aws(domain){
  return new Promise((resolve, reject) => {
    var params = {
      DNSName: domain,
      MaxItems: '1'
    };
    route53.listHostedZonesByName(params).promise()
    .then(res => {
      if(res.HostedZones[0].Name === domain+'.') {
        let params = {Id: res.HostedZones[0].Id.split('/hostedzone/')[1]}
        route53.getHostedZone(params, (err, data) => {
          if (err) reject(err);
          else resolve(data.DelegationSet.NameServers);
        });
      }
      else reject('No hosted zone exists for the given domain')
    })
    .catch(err => reject(err))
  });
}

//GoDaddy
function godaddy(domain){
  return new Promise((resolve, reject) => {
    var url = `https://api.godaddy.com/v1/domains/${domain}`
    //var params = {}
    axios.get(url, {headers: {
      'Authorization': `sso-key ${process.env.GODADDY_API_KEY}:${process.env.GODADDY_SECRET_KEY}`,
      'Content-Type': 'application/json'
    }})
    .then(res => resolve(res.data.nameServers))
    .catch(err => reject(err))
  })
}

module.exports = {
  aws,
  godaddy
}
