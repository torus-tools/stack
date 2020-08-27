var AWS = require('aws-sdk');
const route53 = new AWS.Route53({apiVersion: '2014-05-15'});
const axios = require('axios');
const getDnsId = require('../zones/get')
const listRecords = require('./list')

//delete a record with a given type for a given domain
//domain must be a string that is a valid domain name
//name must be a string with the name of the record
//type must be a string equal to one of the follwoing options:
// A | AAAA | CAA | CNAME | MX | NAPTR | NS | PTR | SOA | SPF | SRV | TXT

//AWS
function aws(domain, records){
  return new Promise((resolve, reject) => {
    getDnsId.aws(domain)
    .then(id => {
      let changes = []
      listRecords.aws(domain).then(data => {
        for(let rec of records) {
          for(let record of data) {
            if(rec.name+'.' === record.Name && rec.type === record.Type){
              if(record.ResourceRecords.length < 1) delete record.ResourceRecords
              changes.push(
                {
                  Action: "DELETE", 
                  ResourceRecordSet: record
                }
              )
              break
            }
          }
        }
        var params = {
          ChangeBatch: {
            Changes: changes
          }, 
          HostedZoneId: id
        }
        route53.changeResourceRecordSets(params).promise()
        .then(data => resolve(data))
        .catch(err => reject(err))
      })
    }).catch(err=>reject(err))
  })
}

function godaddy(domain, records){
  return new Promise((resolve, reject) => {
    listRecords.godaddy(domain).then(godaddyRecords => {
      console.log(godaddyRecords)
      let recordSet = []
      for(let rec of godaddyRecords){
        for(let r in records) {
          if(rec.name === records[r].name && rec.type === records[r].type) break
          else if(r >= records.length-1) recordSet.push(rec)
        }
      }
      const url = `https://api.godaddy.com/v1/domains/${domain}/records`
      console.log(recordSet)
      const params = {
        method: 'put',
        url: url,
        headers: {
          'Authorization': `sso-key ${process.env.GODADDY_API_KEY}:${process.env.GODADDY_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        data:recordSet
      }
      axios(params)
      .then(data => resolve(data))
      .catch(err=> reject(err))
    })
  })
}
  
module.exports = {
  aws,
  godaddy
}
