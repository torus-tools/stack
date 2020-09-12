const {HostedZone} = require('../lib/resourceExists')

HostedZone('azuerotours.com').then(data => console.log(data)).catch(err => console.log(err))