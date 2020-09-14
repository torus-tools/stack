var AWS = require('aws-sdk');
var route53 = new AWS.Route53({apiVersion: '2014-05-15'});
const axios = require('axios');

const listRecords = require('./list')
const getDnsId = require('../zones/get')

//AWS
function aws(domain){
  return new Promise((resolve, reject) => {
    getDnsId.aws(domain)
    .then(id => {
      let changes = []
      listRecords.aws(domain).then(data => {
        for(let record of data) {
          if(record.Type !== 'SOA' && record.Type !== 'NS'){
            if(record.ResourceRecords.length < 1) delete record.ResourceRecords
            changes.push(
              {
                Action: "DELETE", 
                ResourceRecordSet: record
              }
            )
          }
        }
        if(changes.length > 0){
          var params = {
            ChangeBatch: {
              Changes: changes
            }, 
            HostedZoneId: id
          }
          route53.changeResourceRecordSets(params).promise()
          .then(data => resolve(data))
          .catch(err => reject(err))
        }
        else resolve('No records to delete')
      })
    }).catch(err=>reject(err))
  })
}

//godaddy
function godaddy(domain){
  return new Promise((resolve, reject) => {
    const url = `https://api.godaddy.com/v1/domains/${domain}/records`
    const params = {
      method: 'put',
      url: url,
      headers: {
        'Authorization': `sso-key ${process.env.GODADDY_API_KEY}:${process.env.GODADDY_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      data:[]
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
