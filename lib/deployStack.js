// deployStack must contain an option called force or overwrite that overwrites all existing values from the template with the default values 
const generateTemplate = require('./generateTemplate')
const stackExists = require('./stackExists')
const {CloudFrontDist} = require('./resourceExists')
const {stackResources, initialTemplate} = require('./templateDefaults')
const {deployTemplate} = require('./deployTemplate')
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

async function deployStack(domain, stack, config, content, overwrite, local, cli){
  //read the providers from the config  
  var importsTemplate = {template:JSON.parse(JSON.stringify(initialTemplate)), existingResources:[]}

  console.log('Setting up . . .')
  const start_time = new Date().getTime()
  var end_time = start_time
  var time_elapsed = 0

  let template = null
  let partialStack = {
    bucket: false,
    www: false,
    dns: false
  }
  let stackId = await stackExists(domain)
  let templateString = ''
  
  if(stackId) {
    let temp = await cloudformation.getTemplate({StackName: stackId}).promise().catch(err => console.log(err))
    templateString = temp.TemplateBody
    template = JSON.parse(templateString)
  }
  for(let key in partialStack) if(stack[key]) partialStack[key] = true
  
  console.log('finished setting up')
  console.log('generating templates . . .')

  let partialRecords = stack.cdn? false : true

  var partTemplate = local? JSON.parse(fs.readFileSync('./torus/template.json', utf8)): await generateTemplate(domain, partialStack, config, template, partialRecords, overwrite).catch(err => {throw new Error(err)})
  var partialTemplate = JSON.parse(JSON.stringify(partTemplate))
  var fullTemplate = local? partialTemplate : await generateTemplate(domain, stack, config, template, true, overwrite).catch(err => {throw new Error(err)})

  if(partialTemplate && fullTemplate) console.log('finished generating templates')
  
  console.log('PARTIAL TEMPLATE ', JSON.stringify(partialTemplate))
  console.log('FULL TEMPLATE ', JSON.stringify(fullTemplate))

  

  if(stackId && JSON.stringify(fullTemplate.template) === templateString)
  {
    console.log('no changes detected')
    return('no changes detected')
  }
  else {
    //import then update or create
    if(fullTemplate.existingResources.length > 0 && !stackId){
      //console.log('importing existing resources . . .')
      //importsTemplate.existingResources = fullTemplate.existingResources
      //for(elem of fullTemplate.existingResources) importsTemplate.template.Resources[elem['LogicalResourceId']] = fullTemplate.template.Resources[elem['LogicalResourceId']]
      //console.log('IMPORTS TEMPLATE ',importsTemplate)
      deployTemplate(domain, fullTemplate, true)
      //wait for stackImport complete
      .then((data)=> {
        console.log('finished importing resources')
        deployParts(domain, stack, config, partialTemplate, partialStack, fullTemplate, data.template, content)
        .then(data => {
          //save the fullTemplate
          end_time = new Date().getTime()
          time_elapsed = (end_time - start_time)/1000
          console.log('Time Elapsed: ', time_elapsed)
          return data
        }).catch(err=> {throw new Error(err)})
      }).catch(err=> {throw new Error(err)})
    }
    //update or create
    else{
      deployParts(domain, stack, config, partialTemplate, partialStack, fullTemplate, template, content)
      .then(data => {
        //save the fullTemplate
        end_time = new Date().getTime()
        time_elapsed = (end_time - start_time)/1000
        console.log('Time Elapsed: ', time_elapsed)
        return data
      }).catch(err=> {throw new Error(err)})
    } 
  }
}

function deployParts(domain, stack, config, partialTemplate, partialStack, fullTemplate, template, content, cli){
  return new Promise((resolve, reject) => {
    let size = 0;
    console.log('PARTIAL STACK ', partialStack)

    for(let key in partialStack) {
      size += 1;
      //should add an or at the end if the template does exist but the bucket policy isnt public
      if(partialStack[key] && !template || partialStack[key] && !template.Resources[stackResources[key]]) {
        
         // if DNS is true, and the full template includes a cloudfront dist, delete the record set from the partial template to save time
        //if(stack.dns && fullTemplate.template.Resources[stackResources.dns]) delete partialTemplate.template.Resources['RecordSet']

        if(cli) cli.action.start('deploying the partial template')
        else console.log('deploying the partial template . . .')
        
        console.log(JSON.stringify(partialTemplate))
        
        deployTemplate(domain, partialTemplate).then(() => {
          if(cli) cli.action.stop()
          else console.log('finished deploying the partial template')

          deployFull(domain, stack, config, fullTemplate, partialTemplate, content, cli)
          .then(()=> resolve('All Done!')).catch(err => reject(err))
        }).catch(err => reject(err))
        break
      }
      else if(size >= Object.keys(partialStack).length-1){
        deployFull(domain, stack, config, fullTemplate, partialTemplate, content, cli)
        .then(()=> resolve('All Done!')).catch(err => reject(err))
      }
    }
  })
}

//before deploy full must obtain nameservers for route53
function deployFull(domain, stack, config, fullTemplate, partialTemplate, content, cli){
  return new Promise((resolve, reject) => {
    const url = `http://${domain}.s3-website-${process.env.AWS_REGION}.amazonaws.com`;
    let arr = []
    //Upload Files
    if(content) {

      getFiles().then(data => {
        //console.log('uploading content . . .')
        uploadFiles(domain, data.files, data.dir, cli).then(()=>{
          //console.log('finished uploading content')
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
      //get dns nameservers
      domains[config.providers.dns].getNameservers(domain).then(nameservers => {
        if(supported_providers.domain.includes(config.providers.domain)) {
          //automatically update nameservers for supported domian providers
          if(cli) cli.action.start('transfering DNS Nameservers . . .')
          else console.log('transfering DNS Nameservers . . .')
          domains[config.providers.domain].updateNameservers(domain, nameservers).then(()=>{
            if(cli) cli.action.stop()
            else console.log('finished transfering nameservers')
            arr.push(2)
            if(arr.length >= 3) resolve(url)
          }).catch(err => reject(err))
        }
        else {
          //manually update unsupported providers
          let ns = ''
          for(let n of nameservers) ns += n+'\n'
          console.log('Please update the nameservers for this domain to the follwoing:\n', ns)
          arr.push(2)
          if(arr.length >= 3) resolve(url)
        }
      }).catch(err => reject(err))
    }
    else {
      console.log('NOT TRANSFERING NAMESERVERS ', arr.length)

      arr.push(2)
      if(arr.length >= 3) resolve(url)
    }
    //create and verify certificate then
    //Deploy the Full Stack with CDN
    if(JSON.stringify(fullTemplate) !== JSON.stringify(partialTemplate)){
      if(cli) cli.action.start('Deploying the full template')
      else console.log('Deploying the full template . . .')
      deployTemplate(domain, fullTemplate).then(()=>{
        if(cli) cli.action.stop()
        else console.log('finished deploying the full template')
        CloudFrontDist(domain).then(data => {
          //must get the SSL certificate created for the stack
          let records = [
            {
              data: data.domain,
              name: 'www',
              ttl: 3600,
              type: 'CNAME'
            }
          ]
          if(config.providers['dns'] !== 'aws') {
            if(supported_providers.dns.includes(config.providers.dns)){
              if(cli) console.log('creating DNS records')
              else console.log('creating DNS records . . .')
              let recordReroute = false
              let redirectUrl = stack.https?'https://www.'+domain:'http://www.'+domain
              domains[config.providers.dns].upsertRecords(domain, records).then(()=>{
                if(recordReroute) {
                  if(cli) cli.action.stop()
                  else console.log('finished creating DNS records')
                  arr.push(3)
                  if(arr.length >= 3) resolve(url)
                }
                else recordReroute = true
              }).catch(err => reject(err))
              domains[config.providers.dns].createRedirect(domain, redirectUrl).then(()=>{
                if(recordReroute) {
                  if(cli) cli.action.stop()
                  else console.log('finished creating DNS records')
                  arr.push(3)
                  if(arr.length >= 3) resolve(url)
                }
                else recordReroute = true
              }).catch(err => reject(err))
            }
            else {
              console.log('Please create a DNS record with the following properties:\n', records[0], '\n', 'Then create a 301 redirect from the root to www.')
              arr.push(3)
              if(arr.length >= 3) resolve(url)
            }
          }
          else {
            arr.push(3)
            if(arr.length >= 3) resolve(url)
          }
        })
      })
    }
    else {
      console.log('NOT DEPLOYING FULL TEMPLATE ', arr.length)
      
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


/* function publishUpdatedContent(uploads, files, force){
  let filesArr = uploads.keys()
  if(files) filesArr = files
  if(force) for(let key of filesArr) upload(key)
  else for(let key of filesArr) if(uploads[key].last_mod > uploads[key].last_upload) upload(key)
} */

function upload(filePath){
  file = fs.readFileSync(filePath)
  uploadFile(file, filePath)
}


module.exports = {
  deployStack,
  deployFull,
  deployParts
}