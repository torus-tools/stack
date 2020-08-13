// deployStack must contain an option called force or overwrite that overwrites all existing values from the template with the default values 
const generateTemplate = require('./generateTemplate')
const stackExists = require('./stackExists');
const {CloudFrontDist} = require('./resourceExists')
const {stackResources, initialTemplate} = require('./templateDefaults')
const {deployTemplate} = require('./deployTemplate');
const {getFiles, uploadFiles} = require('@torus-tools/content')
const domains = require('@torus-tools/domains')

const AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});

const supported_providers = {
  domain:['aws', 'godaddy'],
  dns:['aws', 'godaddy'],
  storage: ['aws'],
  cdn: ['aws'],
  certificate: ['aws']
}

async function deployStack(domain, stack, config, content, overwrite){
  //read the providers from the config  
  let template = null
  let partialStack = {
    bucket: false,
    www: false,
    route53: false,
  }
  let stackId = await stackExists.aws(domain)
  if(stackId) {
    temp = await cloudformation.getTemplate({StackName: stackId}).promise().catch(err => console.log(err))
    templateString = temp.TemplateBody
    template = JSON.parse(templateString)
  }
  for(let key in partialStack) if(stack[key]) partialStack[key] = true
  const fullTemplate = await generateTemplate(domain, stack, config, template, overwrite)
  const partialTemplate = await generateTemplate(domain, partialStack, config, template, overwrite)
  if(stackId && JSON.stringify(fullTemplate.template) === templateString) return('no changes detected')
  else {
    //import then update or create
    if(fullTemplate.existingResources.length > 1){
      console.log('importing existing resources')
      let importsTemplate = initialTemplate
      for(elem of fullTemplate.existingResources) importsTemplate.Resources[elem['LogicalResourceId']] = fullTemplate.template.Resources[elem['LogicalResourceId']]
      deployTemplate(domain, importsTemplate, fullTemplate.existingResources, true)
      //wait for stackImport complete
      .then(()=>deployParts(domain, stack, config, partialTemplate, partialStack, fullTemplate, importsTemplate, content))
      .then(data => {return data}).catch(err=> {throw new Error(err)})
    }
    //update or create
    else deployParts(domain, stack, config, partialTemplate, partialStack, fullTemplate, template, content).then(data => {return data}).catch(err=> {throw new Error(err)})
  }
}

function deployParts(domain, stack, config, partialTemplate, partialStack, fullTemplate, template, content){
  return new Promise((resolve, reject) => {
    let size = 0;
    for(let key in partialStack) {
      size += 1;
      if(partialStack[key] && !template || partialStack[key] && !template.Resources[stackResources[key]]) {
        console.log('deploying the partial template')
        deployTemplate(domain, partialTemplate)
        .then((data) => {
          let waitAction = 'stackCreateComplete'
          if(data.action === 'UPDATE') waitAction = 'stackUpdateComplete'
          //else if(data.action === 'IMPORT') waitAction = 'stackImportComplete';
          var stackName = domain.split('.').join('') + 'Stack';
          cloudformation.waitFor(waitAction, {StackName: stackName}).promise()
          .then(() => {
            deployFull(domain, stack, config, fullTemplate, partialTemplate, content)
            .then(()=> resolve('All Done!')).catch(err => reject(err))
          }).catch(err => reject(err))
        }).catch(err => reject(err))
        break
      }
      else if(size >= partialStack.keys().length-1){
        deployFull(domain, stack, config, fullTemplate, partialTemplate, content)
        .then(()=> resolve('All Done!')).catch(err => reject(err))
      }
    }
  })
}

//before deploy full must obtain nameservers for route53
function deployFull(domain, stack, config, fullTemplate, partialTemplate, content){
  return new Promise((resolve, reject) => {
    const url = `http://${domain}.s3-website-${process.env.AWS_REGION}.amazonaws.com`;
    let arr = []
    //Upload Files
    if(content) {
      getFiles().then(data => {
        console.log('uploading content')
        uploadFiles(domain, data.files, data.dir).then(()=>{
          arr.push(1)
          if(arr.length >= 3) resolve(url)
        }).catch(err => reject(err))
      }).catch(err => reject(err))
    }
    else {
      arr.push(1)
      if(arr.length >= 3) resolve(url)
    }
    //Transfer Nameservers
    if(stack.dns && config.providers.dns !== config.providers.domain){
      console.log('transfering DNS Nameservers')
      //get dns nameservers
      domains[config.providers.dns].getNameservers(domain).then(nameservers => {
        //automatically update nameservers for supported domian providers
        if(supported_providers.domain.includes(config.providers.domain)) {
          domains[config.providers.domain].updateNameservers(domain, nameservers).then(()=>{
            arr.push(2)
            if(arr.length >= 3) resolve(url)
          }).catch(err => reject(err))
        }
        //manually update unsupported providers
        else {
          let ns = ''
          for(let n of nameservers) ns += n+'\n'
          console.log('Please update the nameservers for this domain to the follwoing:\n', ns)
          arr.push(2)
          if(arr.length >= 3) resolve(url)
        }
      }).catch(err => reject(err))
    }
    else {
      arr.push(2)
      if(arr.length >= 3) resolve(url)
    }
    //create and verify certificate then
    //Deploy the Full Stack with CDN
    if(JSON.stringify(fullTemplate) !== JSON.stringify(partialTemplate)){
      console.log('Deploying the full template')
      deployTemplate(domain, fullTemplate).then(()=>{
        CloudFrontDist(domain).then(data => {
          //need to somehow determine how to create the records.
          //must get the SSL certificate created for the stack
          records = [{domain:data.domain}]
          if(config.providers['dns'] !== 'aws' && supported_providers[config.providers.dns]) {
            createRecord(config.providers.dns, [record]).then(()=>{
              arr.push(3)
              if(arr.length >= 3) resolve(url)
            }) 
          }
          else {
            console.log('please create the following records in your DNS ' + records)
          }
        })
      })
    }
    else {
      arr.push(3)
      if(arr.length >= 3) resolve(url)
    }
  })
}


/* function transferDns(domain, domainProvider, dnsProvider){
  if(domainProvider === dnsProvider) resolve(null) 
  else {
    //get the nameservers
    if(providers.domain.includes(provider)) updateNameservers(nameservers).then(()=>resolve({auotmatic:true, nameservers:nameservers}))
    else resolve({auotmatic:false, nameservers:nameservers})
  }
} */

// records is an array with objects of type record
function createRecord(dnsProvider, records){
  if(dnsProvider === 'aws') resolve(null) 
  else {
    if(providers.dns.includes(provider)) {
      for(record of records) createRecord(domain, provider, record).then(()=>resolve({auotmatic:true, nameservers:nameservers}))
    }
    else resolve({auotmatic:false, nameservers:nameservers})
  }
}

function publishUpdatedContent(uploads, files, force){
  let filesArr = uploads.keys()
  if(files) filesArr = files
  if(force) for(let key of filesArr) upload(key)
  else for(let key of filesArr) if(uploads[key].last_mod > uploads[key].last_upload) upload(key)
}

function upload(filePath){
  file = fs.readFileSync(filePath)
  uploadFile(file, filePath)
}


module.exports = {
  deployStack,
  deployFull,
  deployParts
}