require('dotenv').config()
var AWS = require('aws-sdk');
var route53 = new AWS.Route53({apiVersion: '2014-05-15'});
const axios = require('axios');
const getDnsId = require('../zones/get')

function aws(domain) {
  return new Promise((resolve, reject) => {
    getDnsId.aws(domain).then((id) => {
      var params = {HostedZoneId: id}
      route53.listResourceRecordSets(params).promise()
      .then(data => resolve(data.ResourceRecordSets))
      .catch(err => reject(err))
    }).catch(err => reject(err))
  })
}

function godaddy(domain){
  return new Promise((resolve, reject) => {
    var url = `https://api.godaddy.com/v1/domains/${domain}/records`
    const options = {
      headers: {
        'Authorization': `sso-key ${process.env.GODADDY_API_KEY}:${process.env.GODADDY_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    };
    axios.get(url, options)
    .then(res => resolve(res.data))
    .catch(error => reject(error))
  })
}

module.exports = {
  aws,
  godaddy
}