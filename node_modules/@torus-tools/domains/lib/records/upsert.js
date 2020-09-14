require('dotenv').config()
var AWS = require('aws-sdk');
var route53 = new AWS.Route53({apiVersion: '2014-05-15'});
const axios = require('axios');
const getDnsId = require('../zones/get')
const listRecords = require('./list')

function aws(domain, records){
  return new Promise((resolve, reject) => {
    let changes = []
    for(let record of records){
      changes.push(
        {
          Action: "UPSERT", 
          ResourceRecordSet: {
            Name: record.name, 
            ResourceRecords: [
              {
                Value: record.data
              }
            ], 
            TTL: record.ttl, 
            Type: record.type
          }
        }
      )
    }
    console.log(changes)
    getDnsId.aws(domain).then(hostedZoneId => {
      var params = {
        ChangeBatch: {
          Changes: changes, 
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
    listRecords.godaddy(domain).then(res => {
      let godaddyRecords = []
      for(let obj of res) if(obj.data !== 'Parked') godaddyRecords.push(obj)
      for(let rec of records){
        let record = {}
        record.name = rec.name
        record.type = rec.type
        record.data = rec.data
        record.ttl = rec.ttl
        for(let r in godaddyRecords){
          if(godaddyRecords[r].name === record.name && godaddyRecords[r].type === record.type) {
            godaddyRecords[r] = record
            break
          }
          else if(r >= godaddyRecords.length-1) godaddyRecords.push(record)
        }
      }
      const url = `https://api.godaddy.com/v1/domains/${domain}/records`
      const params = {
        method: 'put',
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
    }).catch(err=> reject(err))
  })
}

module.exports = {
  aws,
  godaddy
}