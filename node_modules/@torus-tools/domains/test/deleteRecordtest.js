const deleteRecords = require('../lib/records/delete')

const records = [
  {name:'@', type:'A'}
]

deleteRecords.godaddy('localizehtml.com', records)
.then(data => console.log(data))
.catch(err => console.log(err))