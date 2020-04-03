var updateCertificate = require('./updateCertificate');
var advancedAwsTemplate = require('../templates');
var advancedAwsTemplateHttps = require('../templates/aws_basic_site');

//function that reads a cloudfomration template and deploys it
module.exports = function deployAdvancedTemplate(https){
  //generate a template type based on the templateType option
	var params = {
    StackName: `${formName}Form`,
    TemplateBody: templateBody,
    TimeoutInMinutes: 5,
    Capabilities: [
      "CAPABILITY_NAMED_IAM"
    ]
  };
  cloudformation.createStack(params, function(err, data) {
    if (err) {
      optionError(err, callback)
    } 
    else {
      var stackArn = data.StackId;
      FormConfig.AddVar(formName, "stackId", stackArn);
      var params = {
        StackName: stackArn
      };
      //validate the certiifcate
      updateCertificate(params, function(err, data){
        if(err) throw new Error(err)
        else {
          //wait for stack update complete
          cloudformation.waitFor('stackCreateComplete', params, function(err, data) {
            if (err) {
              optionError(err, callback)
            }
            else {
              //console.log("the Cloudformation Stack has been created succesfully!")
              if(callback && typeof callback === 'function'){
                callback(null, stackArn);
              }
              else return stackArn
            }
          });
        }
      })
    }    
  });
}