//import necessary stuff
require('dotenv').config();
var AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});

//check that the created template is good
module.exports = function ValidateTemplate(templateBody){
  var params = {
    TemplateBody: templateBody,
  };
  cloudformation.validateTemplate(params, function(err, data) {
    if(err) console.log(err);
    else console.log(data);
  });
}