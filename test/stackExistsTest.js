const stackExists = require('../lib/stackExists')

stackExists.aws('localizehtml.com').then(data => console.log(data)).catch(err => console.log(err))