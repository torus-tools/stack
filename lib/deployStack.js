// deployStack must contain an option called force or overwrite that overwrites all existing values from the template with the default values 
const generateTemplate = require('./generateTemplate')
const stackExists = require('./stackExists')
const {CloudFrontDist} = require('./resourceExists')
const {stackResources, initialTemplate} = require('./templateDefaults')
const {deployTemplate} = require('./deployTemplate')
const {listFiles, uploadContent} = require('@torus-tools/content')
const domains = require('@torus-tools/domains')

const AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});

const supported_providers = {
  registrar:['aws', 'godaddy'],
  bucket: ['aws'],
  dns:['aws', 'godaddy'],
  cdn: ['aws'],
  ssl: ['aws']
}

async function deployStack(domain, stack, config, content, overwrite, local, cli){
  //read the providers from the config  
  //var importsTemplate = {template:JSON.parse(JSON.stringify(initialTemplate)), existingResources:[]}
  console.time('Elapsed Time')
  console.log('Setting up . . .')
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
  if(stackId && JSON.stringify(fullTemplate.template) === templateString){
    console.log('no changes detected')
    return('no changes detected')
  }
  else {
    //import then update or create
    if(fullTemplate.existingResources.length > 0 && !stackId){
      deployTemplate(domain, fullTemplate, true)
      .then((data)=> {
        console.log('finished importing resources')
        deployParts(domain, stack, config, partialTemplate, partialStack, fullTemplate, data.template, content, cli)
        .then(data => {
          console.timeEnd('Elapsed Time')
          return data
        }).catch(err=> {throw new Error(err)})
      }).catch(err=> {throw new Error(err)})
    }
    //update or create
    else{
      deployParts(domain, stack, config, partialTemplate, partialStack, fullTemplate, template, content, cli)
      .then(data => {
        console.timeEnd('Elapsed Time')
        return data
      }).catch(err=> {throw new Error(err)})
    } 
  }
}

function deployParts(domain, stack, config, partialTemplate, partialStack, fullTemplate, template, content, cli){
  return new Promise((resolve, reject) => {
    let size = 0;
    for(let key in partialStack) {
      size += 1;
      //should add an or at the end if the template does exist but the bucket policy isnt public
      if(partialStack[key] && !template || partialStack[key] && !template.Resources[stackResources[key]]) {
        cli? cli.action.start('Deploying basic resources') : console.log('Deploying basic resources...')
        deployTemplate(domain, partialTemplate).then(() => {
          if(cli) cli.action.stop()
          deployFull(domain, stack, config, fullTemplate, partialTemplate, content, cli)
          .then(url=> resolve(url)).catch(err => reject(err))
        }).catch(err => reject(err))
        break
      }
      else if(size >= Object.keys(partialStack).length-1){
        //console.log('NOT DEPLOYINBG PARTIAL ')
        deployFull(domain, stack, config, fullTemplate, partialTemplate, content, cli)
        .then(url=> resolve(url)).catch(err => reject(err))
        break
      }
    }
  })
}

//need to pass a param that contains the exisitng tempplate. if that template exists and contains a resource CDN then the cache for updates resources should be invalidated.
//before deploy full must obtain nameservers for route53
function deployFull(domain, stack, config, fullTemplate, partialTemplate, content, cli){
  return new Promise((resolve, reject) => {
    let fullstack = false
    let done = false
    //Transfer Nameservers
    transferNs(domain, stack, config, cli).then(data=>{
      if(content) {
        listFiles().then(data => {
          uploadContent(domain, data, false, false, null, cli).then(()=>{
            done? resolve('All Done!'): done=true
            if(fullstack) cli? cli.action.start('Deploying additional resources'): console.log('Deploying additional resources')
          }).catch(err => reject(err))
        }).catch(err => reject(err))
      }
      if(JSON.stringify(fullTemplate) !== JSON.stringify(partialTemplate)){
        fullstack = true
        deployTemplate(domain, fullTemplate).then(()=>{
          if(cli) cli.action.stop()
          CloudFrontDist(domain).then(data => {
            cli? cli.action.start('creating records'): console.log('creating records...')
            createRecords(domain, stack, config, data.domain, cli)
            .then(data=>{
              if(cli) cli.action.stop()
              done? resolve('All Done!'): done=true
            })
          })
        })
      }
      else done? resolve('All Done!'): done=true
    })
  })
}

function transferNs(domain, stack, config, cli){
  return new Promise((resolve, reject)=>{
    let ns = ''
    if(stack.dns && config.providers.dns !== config.providers.registrar){
      domains[config.providers.dns].getNameservers(domain).then(nameservers => {
        if(supported_providers.registrar.includes(config.providers.registrar)) {
          //update nameservers automatrically for godaddy & AWS
          cli? cli.action.start('Updating domain nameservers') : console.log('Updating domain nameservers...')
          domains[config.providers.registrar].updateNameservers(domain, nameservers).then(data=>{
            resolve(data)
          }).catch(err => reject(err))
        }
        else {
          //manually update nameservers for unsupported providers
          for(let n of nameservers) ns += n+'\n'
          console.log('\n\x1b[33mPlease update the nameservers for this domain to the following:\x1b[0m\n'+ns)
          cli.prompt('Have you finished updating the nameservers?').then(res=>{
            if(res==='y' || res==='yes' || res==='Y' || res==='YES') resolve('done')
            else reject('You must update your nameservers when the DNS is different to the registrar')
          })
        }
      }).catch(err => reject(err))
    }
  })
}

function createRecords(domain, stack, config, url, cli){
  return new Promise((resolve, reject)=> {
    let records = [
      {
        data: url,
        name: 'www',
        ttl: 3600,
        type: 'CNAME'
      }
    ]
    if(config.providers['dns'] !== 'aws') {
      if(supported_providers.dns.includes(config.providers.dns)){
        cli? cli.action.start('creating DNS records'): console.log('creating DNS records...')
        let recordReroute = false
        let redirectUrl = stack.https?'https://www.'+domain:'http://www.'+domain
        domains[config.providers.dns].upsertRecords(domain, records).then(()=>{
          recordReroute? resolve('All Done'): recordReroute = true
        }).catch(err => reject(err))
        domains[config.providers.dns].createRedirect(domain, redirectUrl).then(()=>{
          recordReroute? resolve('All Done'): recordReroute = true
        }).catch(err => reject(err))
      }
      else {
        console.log('Please create a DNS record with the following properties:\n', records[0], '\n', 'Then create a 301 redirect from the root to www.')
        resolve('All Done')
      }
    }
  })
}

//FOR S3
/* ResourceRecordSet: {
  AliasTarget: {
    DNSName: `s3-website-${process.env.AWS_REGION}.amazonaws.com`, 
    EvaluateTargetHealth: false, 
    HostedZoneId: 'Z3AQBSTGFYJSTF' // a code depending on your region and resource for more info refer to https://docs.aws.amazon.com/general/latest/gr/rande.html#s3_website_region_endpoints
  }, 
  Name: wname, 
  Type: "A"
} */

//FOR CLOUDFRONT
/* ResourceRecordSet: {
  Name: domain,
  Type: 'A',
  ResourceRecords: [],
  AliasTarget:
  { 
      HostedZoneId: obj.hostedZoneId,
      DNSName: data.Distribution.DomainName,
      EvaluateTargetHealth: false 
  }
} */


module.exports = {
  deployStack,
  deployFull,
  deployParts
}