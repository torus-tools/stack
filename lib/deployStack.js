// deployStack must contain an option called force or overwrite that overwrites all existing values from the template with the default values 
const generateTemplate = require('./generateTemplate')
const stackExists = require('./stackExists');
const {stackResources, initialTemplate} = require('./templateDefaults')
const {deployTemplate} = require('./deployTemplate');
const AWS = require('aws-sdk');
const { uploadFile } = require('..');

const providers = {
  domain:['aws', 'godaddy'],
  dns:['aws', 'godaddy'],
  storage: ['aws'],
  cdn: ['aws'],
  certificate: ['aws']
}

async function deployStack(domain, stack, options, overwrite){
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
  const fullTemplate = await generateTemplate(domain, stack, options, template, overwrite)
  const partialTemplate = await generateTemplate(domain, partialStack, options, template, overwrite)
  if(stackId && JSON.stringify(fullTemplate.template) === templateString) return('no changes detected')
  else {
    //import then update or create
    if(fullTemplate.existingResources.length > 1){
      let importsTemplate = initialTemplate
      for(elem of fullTemplate.existingResources) importsTemplate.Resources[elem['LogicalResourceId']] = fullTemplate.template.Resources[elem['LogicalResourceId']]
      deployTemplate(domain, importsTemplate, fullTemplate.existingResources, true)
      .then(()=>deployParts(partialTemplate, fullTemplate, importsTemplate))
    }
    //update or create
    else deployParts(partialTemplate, fullTemplate, existingTemplate, tryTransferThenDeploy)
  }
}


function deployParts(partialTemplate, fullTemplate, existingTemplate, deployPart2){
  let size = 0;
  for(let key in partialStack) {
    size += 1;
    if(partialStack[key] && !existingTemplate.Resources[stackResources[key]]) {
      //deploy part 1
      deployTemplate(domain, partialTemplate)
      .then(()=> {
        //deploy part 2
        deployFull(domain, content, fullTemplate)
      })
      break
    }
    else if(size >= partialStack.keys().length){
      //deploy part 2 only
      deployFull(domain, content, template)
    }
  }
}

function deployFull(domain, template, uploadContent){
  var arr = []
  return new Promise((resolve, reject) => {
    // first check if the resources 
    if(uploadContent) {
      uploadContent()
      .then(()=>{
        arr.push(1)
        if(arr.length >= 2) resolve()
      })
    }
    //full deploy
    deployTemplate(domain, template)
    .then(()=>{
      //create DNS records
    })
    .then(()=>{
      arr.push(2)
      if(arr.length >= 2) resolve('All Done!')
    })
  })
}

function transferDns(domainProvider, dnsProvider, nameservers){
  if(domainProvider === dnsProvider) resolve(null) 
  else {
    if(providers.domain.includes(provider)) updateNameservers(nameservers).then(()=>resolve({auotmatic:true, nameservers:nameservers}))
    else resolve({auotmatic:false, nameservers:nameservers})
  }
}

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



