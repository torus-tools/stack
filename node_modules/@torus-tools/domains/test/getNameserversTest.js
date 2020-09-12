const dns = require('../index')

dns.godaddy.getNameservers('localizehtml.com').then(data=>console.log(data)).catch(err=>console.log(err))

dns.aws.getNameservers('supereasyforms.com').then(data=>console.log(data)).catch(err=>console.log(err))