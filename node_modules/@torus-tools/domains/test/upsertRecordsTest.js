const upsertRecords = require('../lib/records/upsert')

const records = [
  {
    data: 'dupis5soxnbme.cloudfront.net',
    name: 'www',
    ttl: 3600,
    type: 'CNAME'
  }
]

upsertRecords.godaddy('localizehtml.com', records)
.then(res => console.log('DATA ', res))
.catch(err=> console.log('ERROR ', err.response.data))
