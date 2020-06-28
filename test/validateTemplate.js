//import necessary stuff
require('dotenv').config();
var AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});
var genTemp = require('../lib/generateTemplate')

//check that the created template is good
function ValidateTemplate(templateBody){
  var params = {
    TemplateBody: templateBody,
  };
  cloudformation.validateTemplate(params, function(err, data) {
    if(err) console.log(err);
    else console.log('Test Succesful');
  });
}

console.log('hello')
genTemp('my.com', 'index.html', 'error.html',).then(data => console.log('HI THERE BUDDY \n', data))
//ValidateTemplate(JSON.stringify(genTemp('my.com', 'index.html', 'error.html', true, true)))