var checkResource = require('../lib/checkResource')
//var validateTemplate = require('./validateTemplate')

checkResource.distributionExists('supereasyforms.com', function(err, data){
  if(err) console.log(err)
  else console.log(data)
})