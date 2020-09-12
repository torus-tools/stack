const addRecords = require('../lib/records/add')

const records = [
  {
    data: 'dupis5soxnbme.cloudfront.net',
    name: 'www',
    ttl: 3600,
    type: 'CNAME'
  }
]

addRecords.godaddy('localizehtml.com', records)
.then(res => console.log('DATA ', res))
.catch(err=> console.log('ERROR ', err.response.data))
