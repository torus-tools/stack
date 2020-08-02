// deployStack must contain an option called force or overwrite that overwrites all existing values from the template with the default values 
const generateTemplate = require('./generateTemplate')
const stackExists = require('./stackExists');
const {stackResources, initialTemplate} = require('./templateDefaults')
const {deployTemplate} = require('./deployTemplate');
const { FSx } = require('aws-sdk');
const { uploadFile } = require('..');

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
    template = JSON.parse(temp.TemplateBody)
  }
  for(let key in partialStack) if(stack[key]) partialStack[key] = true
  const fullTemplate = await generateTemplate(domain, stack, options, template, overwrite)
  const partialTemplate = await generateTemplate(domain, partialStack, options, template, overwrite)
  if(fullTemplate.existingResources.length > 1){
    let importsTemplate = initialTemplate
    for(elem of fullTemplate.existingResources) importsTemplate.Resources[elem['LogicalResourceId']] = fullTemplate.template.Resources[elem['LogicalResourceId']]
    deployTemplate(domain, importsTemplate, fullTemplate.existingResources, true)
    .then(()=>deployParts(partialTemplate, fullTemplate, importsTemplate))
  }
  else deployParts(partialTemplate, fullTemplate, existingTemplate, tryTransferThenDeploy)
}

function deployParts(partialTemplate, fullTemplate, existingTemplate, deployPart2){
  let size = 0;
  for(let key in partialStack) {
    size += 1;
    if(partialStack[key] && !existingTemplate.Resources[stackResources[key]]) {
      deployTemplate(domain, partialTemplate)
      .then(()=> {
        deployPart2(domain, content, fullTemplate)
      })
      break
    }
    else if(size >= partialStack.keys().length) deployPart2(domain, content, template)
  }
}

//transferDns()
//if the DNS is set to route53 but there isnt an existing hostedZone 
  //if domain !== AWS and is included in the list of providers) transfer nameservers automatically then resolve
  //else {
    //console.log('please create the nameservers manually in your domain's DNS then you can run the command again') 
    //prompt('are you done creating nameservers?')
    // await response then resolve

//tryTransferThenDeploy()
//try to transfer nameservers automatically
//then deployPart2

function deployPart2(domain, template, uploadContent){
  var arr = []
  return new Promise((resolve, reject) => {
    if(uploadContent) {
      uploadContent()
      .then(()=>{
        arr.push('step1')
        if(arr.length >= 2) resolve()
      })
    }
    deployTemplate(domain, template)
    .then(()=>{
      //create DNS records
    })
    .then(()=>{
      arr.push('step2')
      if(arr.length >= 2) resolve('All Done!')
    })
  })
}

publishUpdatedContent(uploads, files, force){
  //iterate over uplpoads object
  if(files && files.lnegth > 0){
    for(let key of files){
      if(force) upload(key)
      else if(uploads[key].last_mod > uploads[key].last_upload) upload(key)
    }
  }
  else {
    for(let key in uploads){
      if(force) upload(key)
      else if(uploads[key].last_mod > uploads[key].last_upload) upload(key)
    }
  }
}

function upload(filePath){
  file = fs.readFileSync(filePath)
  uploadFile(file, filePath)
}


// records is an array with objects of type record
//function createDnsRecords(records)
// if(DNS !== AWS)
  // if(the provider is included in the list of providers) createRecordsAutomatically
  // else console.log('please create the fommowing records manually in your domain's DNS then you can run the command again')
// else resolve('All Done') 
