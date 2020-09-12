const createRedirect = require('../lib/records/createRedirect')

createRedirect.godaddy('localizehtml.com', 'http://www.localizehtml.com')
.then(res => console.log('DATA ', res))
.catch(err=> console.log('ERROR ', err))