var checkResource = require('../lib/checkResource')
//var validateTemplate = require('./validateTemplate')


function checkstuff(){
  checkResource.bucketExists('supereasyforms.com').then(function(err,data){console.log('hello')})
}

checkstuff()
