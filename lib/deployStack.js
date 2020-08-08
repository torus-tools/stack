// deployStack must contain an option called force or overwrite that overwrites all existing values from the template with the default values 
const generateTemplate = require('./generateTemplate')
const stackExists = require('./stackExists');
const {stackResources, initialTemplate} = require('./templateDefaults')
const {deployTemplate} = require('./deployTemplate');
const AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});

const providers = {
  domain:['aws', 'godaddy'],
  dns:['aws', 'godaddy'],
  storage: ['aws'],
  cdn: ['aws'],
  certificate: ['aws']
}

async function deployStack(domain, stack, config, overwrite){
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
      let importsTemplate = initialTemplate
      for(elem of fullTemplate.existingResources) importsTemplate.Resources[elem['LogicalResourceId']] = fullTemplate.template.Resources[elem['LogicalResourceId']]
      deployTemplate(domain, importsTemplate, fullTemplate.existingResources, true)
      //wait for stackImport complete
      .then(()=>deployParts(domain, partialTemplate, partialStack, fullTemplate, importsTemplate))
    }
    //update or create
    else deployParts(domain, partialTemplate, partialStack, fullTemplate, template)
  }
}


function deployParts(domain, partialTemplate, partialStack, fullTemplate, template){
  let size = 0;
  for(let key in partialStack) {
    console.log('KEY ', key)
    size += 1;
    if(partialStack[key] && !template || partialStack[key] && !template.Resources[stackResources[key]]) {
      //deploy part 1
      deployTemplate(domain, partialTemplate)
      .then((data) => {
        let waitAction = 'stackCreateComplete'
        if(data.action === 'UPDATE') waitAction = 'stackUpdateComplete'
        //else if(data.action === 'IMPORT') waitAction = 'stackImportComplete';
        var stackName = domain.split('.').join('') + 'Stack';
        cloudformation.waitFor(waitAction, {StackName: stackName}).promise()
        .then(() => console.log('All Done!'))
      })
      //wait for stack update or stack create complete
      /* .then(()=> {
        //deploy part 2
        deployFull(domain, content, fullTemplate).then(()=> resolve('All Done!'))
      }) */
      break
    }
    /* else if(size >= partialStack.keys().length-1){
      //deploy part 2 only
      deployFull(domain, content, template, template).then(()=> resolve('All Done!'))
    } */
  }
}

//before deploy full must obtain nameservers for route53

function deployFull(domain, stack, fullTemplate, partialTemplate, uploadContent){
  var arr = []
  return new Promise((resolve, reject) => {
    if(uploadContent) {
      uploadContent()
      .then(()=>{
        arr.push(1)
        url = `http://${args.domain}.s3-website-${process.env.AWS_REGION}.amazonaws.com`;
        console.log(url)
        if(arr.length >= 3) resolve(url)
      })
    }
    if(stack.dns && config.providers[dns] !== config.providers[domain]){
      transferDns().then((data)=>{
        arr.push(2)
        if(arr.length >= 3) resolve(url)
        if(!data.automatic) {
          let ns = ''
          for(let n of data.nameservers) ns += n+'\n'
          console.log('Please update the nameservers for this domain to the follwoing:\n', ns)
        }
      })
    }
    else arr.push(2)
    //full deploy
    if(fullTemplate !== PartialTemplate){
      deployTemplate(domain, template)
      .then(()=>{
        //cfDomain = getCFdomain() 
        if(config.providers['dns'] !== 'aws' && providers[config.providers.dns]) createRecord(config.providers.dns, [record])
      })
      .then(()=>{
        arr.push(3)
        if(arr.length >= 3) resolve('All Done!')
      })
    }
    else arr.push(3)
  })
}

function transferDns(domain, domainProvider, dnsProvider){
  if(domainProvider === dnsProvider) resolve(null) 
  else {
    //get the nameservers
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


module.exports = {
  deployStack,
  deployFull,
  deployParts
}