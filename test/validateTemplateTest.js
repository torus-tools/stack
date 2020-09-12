require('dotenv').config();
var AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});

let templateBody = {"AWSTemplateFormatVersion":"2010-09-09","Resources":{"RootBucket":{"Type":"AWS::S3::Bucket","DeletionPolicy":"Delete","Properties":{"AccessControl":"PublicRead","BucketName":"azuerotours.com","WebsiteConfiguration":{"ErrorDocument":"error.html","IndexDocument":"index.html"}}},"HostedZone":{"Type":"AWS::Route53::HostedZone","DeletionPolicy":"Delete","Properties":{"Name":"azuerotours.com"}}}}

cloudformation.validateTemplate({TemplateBody: JSON.stringify(templateBody)}).promise()
.then((data)=> console.log(data))
.catch(err=>console.log(err))
