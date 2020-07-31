var assert = require('assert');
var generateTemplate = require('../lib/generateTemplate')
//var ValidateTemplate = require('../lib/ValidateTemplate')
//var AWS = require('aws-sdk-mock');
var AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});

let templi = {"AWSTemplateFormatVersion":"2010-09-09","Resources":{"BucketPolicy":{"Type":"AWS::S3::BucketPolicy","Properties":{"Bucket":"testingsite.com","PolicyDocument":{"Version":"2012-10-17","Statement":[{"Sid":"PublicReadGetObject","Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::testingsite.com/*"}]}}},"RootBucket":{"Type":"AWS::S3::Bucket","Properties":{"AccessControl":"PublicRead","BucketName":"testingsite.com","WebsiteConfiguration":{"ErrorDocument":"error.html","IndexDocument":"index.html"}}}}}

let stack = {
  bucket: true,
  www: true,
  cdn: true,
  route53: true,
  https: true
}

let options = {
  index:"index.html",
  error:"error.html"
}

describe('Check the generateTemplate method', function() {
  let domain = "test.com";
  describe('No params supplied',()=>{
    it('Should produce an error', ()=>{
     generateTemplate().catch(err => assert.equal(err.includes('invalid domain'), true))
    })
  });
  describe('Validates a generated cloudFromation template for a prod setup', ()=>{
    it('Should generate a basic template and validate it with the AWS SDK', async function() { 
      let temp = await generateTemplate(domain, stack, options)
      let templateBody = temp.template
      assert.equal(typeof templateBody, "object")
      assert.equal(JSON.stringify(templateBody).length>20? true:false, true)
      let validate = await cloudformation.validateTemplate({TemplateBody: JSON.stringify(templateBody)}).promise().catch(err=>console.log(err))
      assert.equal(typeof validate, 'object')
    });
  });
});