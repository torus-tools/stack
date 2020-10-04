require('dotenv').config();
var assert = require('assert');
var generateTemplate = require('../lib/generateTemplate')
//var ValidateTemplate = require('../lib/ValidateTemplate')
//var AWS = require('aws-sdk-mock');
var AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});

const stack = {
  bucket: true,
  www: true,
  dns: true,
  cdn: false,
  https: false
}

const config = {
  options: {
    index:"index.html",
    error:"error.html",
  },
  last_deployment:"",
  providers: {
    domain: 'godaddy',
    bucket: 'aws',
    cdn: 'aws',
    dns: 'aws',
    https: 'aws'
  }
}

describe('Check the generateTemplate method', function() {
  let domain = "www.test.com";
  describe('No params supplied',()=>{
    it('Should produce an error', ()=>{
     generateTemplate().catch(err => assert.strictEqual(err.includes('Error: Please use a valid domain name'), true))
    })
  });
  describe('Validates a generated cloudFromation template for a prod setup', ()=>{
    it('Should call the generateTemplate method and validate  the result with the AWS SDK', async function() { 
      let temp = await generateTemplate(domain, stack, config)
      let templateBody = temp.template
      //console.log(templateBody)
      assert.strictEqual(typeof templateBody, "object")
      assert.strictEqual(JSON.stringify(templateBody).length>20? true:false, true)
      let validate = await cloudformation.validateTemplate({TemplateBody: JSON.stringify(templateBody)}).promise().catch(err=>console.log(err))
      assert.strictEqual(typeof validate, 'object')
    });
  });
});