const {deployStack} = require('../lib/deployStack')

deployStack('testingsit.com', {bucket:true}, {index:'index.html', error:'error.html', providers:{bucket:'aws'}}, true)