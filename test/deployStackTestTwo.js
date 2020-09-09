const {deployStack} = require('../lib/deployStack')

const stack = {
  bucket: true,
  www: true,
  dns: false,
  cdn: true,
  https: false
}

const config = {
  index:"index.html",
  error:"error.html",
  last_deployment:"",
  providers: {
    domain: 'godaddy',
    bucket: 'aws',
    cdn: 'aws',
    dns: 'godaddy',
    https: 'aws'
  }
}

deployStack('localizehtml.com', stack, config, true)