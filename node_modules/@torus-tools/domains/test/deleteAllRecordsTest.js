const deleteAllRecords = require('../lib/records/deleteAll')

deleteAllRecords.aws('localizehtml.com')
.then(data => console.log(data))
.catch(err => console.log(err))