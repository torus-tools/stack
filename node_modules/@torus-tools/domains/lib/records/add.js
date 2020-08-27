require('dotenv').config()
var AWS = require('aws-sdk');
var route53 = new AWS.Route53({apiVersion: '2014-05-15'});
const axios = require('axios');
const getDnsId = require('../zones/get')

function aws(domain, records){
  return new Promise((resolve, reject) => {
    getDnsId.aws(domain).then(hostedZoneId => {
      var params = {
        ChangeBatch: {
          Changes: [
            {
              Action: "UPSERT", 
              ResourceRecordSet: {
                Name: "example.com", 
                ResourceRecords: [
                  {
                    Value: "192.0.2.44"
                  }
                ], 
                TTL: 60, 
                Type: "A"
              }
            }
          ], 
        }, 
        HostedZoneId: hostedZoneId
      };
      route53.changeResourceRecordSets(params).promise()
      .then(data => resolve(data))
      .catch(err => reject(err))
    })
  })
}

function godaddy(domain, records){
  return new Promise((resolve, reject) => {
    const url = `https://api.godaddy.com/v1/domains/${domain}/records`
    let godaddyRecords = []
    for(let r of records){
      let record = {}
      record.name = r.name
      record.type = r.type
      record.data = r.data
      record.ttl = r.ttl
      godaddyRecords.push(record)
    }
    console.log(godaddyRecords)
    const params = {
      method: 'patch',
      url: url,
      headers: {
        'Authorization': `sso-key ${process.env.GODADDY_API_KEY}:${process.env.GODADDY_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      data:godaddyRecords
    }
    axios(params)
    .then(data => resolve(data))
    .catch(err=> reject(err))
  })
}

module.exports = {
  aws,
  godaddy
}