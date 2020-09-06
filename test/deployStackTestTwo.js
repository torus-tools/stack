const {deployStack} = require('../lib/deployStack')

const stack = {
  bucket: true,
  www: true,
  dns: true,
  cdn: false,
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
    dns: 'aws',
    https: 'aws'
  }
}

deployStack('localizehtml.com', stack, config, true)