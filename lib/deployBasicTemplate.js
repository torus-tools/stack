//function that reads a cloudfomration template and deploys it
var basicTemplate = require('../templates/aws_basic_site')

module.exports = function deployTemplate(domain, index, error){
  //generate a template type based on the templateType option
  let templateBody = basicTemplate(domain, index, error);
	var params = {
    StackName: `${domain}Stack`,
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
      FormConfig.AddVar(siteName, "stackId", stackArn);
      var params = {
        StackName: stackArn
      };
      //console.log("The Cloudformation Stack is being created . . .")
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
  });
}