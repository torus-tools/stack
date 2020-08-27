const listRecords = require('../lib/records/list')

/* listRecords.godaddy('localizehtml.com')
.then(res => console.log(res))
.catch(err=> console.log(err))
 */
listRecords.aws('gkpty.com')
.then(res => {for(let r of res) console.log(JSON.stringify(r))})
.catch(err=> console.log(err))