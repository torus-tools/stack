const {deployStack} = require('../lib/deployStack')

const stack = {
  bucket: true,
  www: true,
  dns: true,
  cdn: true,
  https: true
}

const config = {
  index:"index.html",
  error:"error.html",
  last_deployment:"",
  providers: {
    domain: 'other',
    bucket: 'aws',
    cdn: 'aws',
    dns: 'aws',
    https: 'aws'
  }
}

deployStack('panamaexpedition.com', stack, config, true)