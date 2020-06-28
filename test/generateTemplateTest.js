var assert = require('assert');
var generateTemplate = require('../lib/generateTemplate')
//var ValidateTemplate = require('../lib/ValidateTemplate')
//var AWS = require('aws-sdk-mock');

generateTemplate('mylow.com', 'index.html', 'error.html').then(data => console.log(data))
/*
describe('Check the generateTemplate method', function() {
  beforeEach(function() {
    createDir("./forms")
  })
  let domain = "test.com";
  let indexDoc = "index.html";
  let errDoc = "error.html"
  describe('No params supplied',()=>{
    it('Should produce an error', ()=>{
     generateTemplate().catch(err => assert.equal(err.message.includes("required parameter"), true))
  });
  describe('Validates a generated cloudFromation template for a dev setup', ()=>{
    it('Should generate a basic template and validate it with the AWS SDK', async ()=> { 
      let templateBody = await generateTemplate(domain)
      assert.equal(typeof templateBody, "string")
      assert.equal(templateBody.length>20? true:false, true)
      let validate = cloudformation.validateTemplate({TemplateBody: templateBody}).promise()
      validate.should.exist()
    });
  });
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
  });
}); */