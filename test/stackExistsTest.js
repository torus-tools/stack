const stackExists = require('../lib/stackExists')

stackExists('localizehtml.com').then(data => console.log(data)).catch(err => console.log(err))