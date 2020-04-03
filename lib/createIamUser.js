
require('dotenv').config();
var {optionError} = require('./InternalModules')

let regionSet = [
  "us-east-2",
  "us-east-1",
  "us-west-1",
  "us-west-2",
  "ap-east-1",
  "ap-south-1",
  "ap-northeast-2",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ca-central-1",
  "cn-north-1",
  "cn-northwest-1",
  "eu-central-1",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-north-1",
  "me-south-1",
  "sa-east-1",
  "us-gov-east-1",
  "us-gov-west-1"
];

//adds aws region to config and 
module.exports = function CreateIamUser(iamUserName, awsRegion, callback) {
  if(/^[a-zA-Z0-9]*$/.test(iamUserName)){
    var url = `https://console.aws.amazon.com/iam/home?region=${awsRegion}#/users$new?step=review&accessKey&userNames=${iamUserName}&permissionType=policies&policies=arn:aws:iam::aws:policy%2FAdministratorAccess`;
    if(awsRegion){
      if(regionSet.includes(awsRegion)){
        if(callback && typeof callback === 'function'){
          callback(null, url);
        }
        else{
          return url;
        }
      }
      else {
        let err = "Invalid AWS region code";
        optionError(err, callback)  
      }
    }
    else {
      if(process.env.AWS_REGION){
        awsRegion = process.env.AWS_REGION
        if(callback && typeof callback === 'function'){
          callback(null, url);
        }
        else{
          return url;
        }
      }
      else{
        let err = "no AWS_REGION variable found in the .env file";
        optionError(err, callback)
      }
    }
  }
  else {
    let err = "Name of the IAM user is invalid. Only alphanumeric characters accepted. No spaces.";
    optionError(err, callback);
  }
}