const {deployStack} = require('../lib/deployStack')

deployStack('testingsites.com', {bucket:true}, {index:'index.html', error:'error.html', providers:{bucket:'aws'}})