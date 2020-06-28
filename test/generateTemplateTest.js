var assert = require('assert');
var generateTemplate = require('../lib/generateTemplate')
//var ValidateTemplate = require('../lib/ValidateTemplate')
//var AWS = require('aws-sdk-mock');
var AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});

let templi = {"AWSTemplateFormatVersion":"2010-09-09","Resources":{"BucketPolicy":{"Type":"AWS::S3::BucketPolicy","Properties":{"Bucket":"testingsite.com","PolicyDocument":{"Version":"2012-10-17","Statement":[{"Sid":"PublicReadGetObject","Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::testingsite.com/*"}]}}},"RootBucket":{"Type":"AWS::S3::Bucket","Properties":{"AccessControl":"PublicRead","BucketName":"testingsite.com","WebsiteConfiguration":{"ErrorDocument":"error.html","IndexDocument":"index.html"}}}}}

describe('Check the generateTemplate method', function() {
  let domain = "test.com";
  let indexDoc = "index.html";
  let errDoc = "error.html"
  describe('No params supplied',()=>{
    it('Should produce an error', ()=>{
     generateTemplate().catch(err => assert.equal(err.includes('invalid domain'), true))
    })
  });
  describe('Validates a generated cloudFromation template for a dev setup', ()=>{
    it('Should generate a basic template and validate it with the AWS SDK', async function() { 
      let temp = await generateTemplate(domain)
      let templateBody = temp.template
      assert.equal(typeof templateBody, "object")
      assert.equal(JSON.stringify(templateBody).length>20? true:false, true)
      let validate = await cloudformation.validateTemplate({TemplateBody: JSON.stringify(templateBody)}).promise().catch(err=>console.log(err))
      assert.equal(typeof validate, 'object')
    });
  });
  describe('Validates a generated cloudFromation template for a test setup', ()=>{
    it('Should generate a basic template and validate it with the AWS SDK', async function() { 
      let temp = await generateTemplate(domain, 'index.html', 'error.html', true, false, true, false)
      let templateBody = temp.template
      assert.equal(typeof templateBody, "object")
      assert.equal(JSON.stringify(templateBody).length>20? true:false, true)
      let validate = await cloudformation.validateTemplate({TemplateBody: JSON.stringify(templateBody)}).promise().catch(err=>console.log(err))
      assert.equal(typeof validate, 'object')
    });
  });
  describe('Validates a generated cloudFromation template for a prod setup', ()=>{
    it('Should generate a basic template and validate it with the AWS SDK', async function() { 
      let temp = await generateTemplate(domain, 'index.html', 'error.html', true, true, true, true)
      let templateBody = temp.template
      assert.equal(typeof templateBody, "object")
      assert.equal(JSON.stringify(templateBody).length>20? true:false, true)
      let validate = await cloudformation.validateTemplate({TemplateBody: JSON.stringify(templateBody)}).promise().catch(err=>console.log(err))
      assert.equal(typeof validate, 'object')
    });
  });
  /*
  describe('Validates a generated cloudFromation template for a test setup', ()=>{
    it('Should generate a test template and validate it with the AWS SDK', async () =>{ 
      let templateBody = await generateTemplate(domain, indexDoc, errDoc, true, false, true)
      assert.equal(typeof templateBody, "string")
      assert.equal(templateBody.length>80? true:false, true)
      let validate = cloudformation.validateTemplate({TemplateBody: templateBody}).promise()
      validate.should.exist()
    });
  });
  describe('Validates a generated cloudFromation template for a production setup', ()=>{
    it('Should generate a production template and validate it with the AWS SDK', async ()=>{ 
      let templateBody = await generateTemplate(domain, indexDoc, errDoc, true, true, true, true)
      assert.equal(typeof templateBody, "string")
      assert.equal(templateBody.length>160? true:false, true)
      let validate = cloudformation.validateTemplate({TemplateBody: templateBody}).promise()
      validate.should.exist()
    });
  }); */
});