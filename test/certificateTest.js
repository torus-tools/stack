const Cert = require('../lib/deployCertificate')
const Domains = require('@torus-tools/domains')
const domain = 'gkpty.com'
const certArn = ''
const hzid = ''
cfdomain = ''

/* Cert.createCertificate(domain)
.then(data=>console.log(data))
.catch(err=>console.log(err)) */

/* 
Name: domain,
Type: 'A',
ResourceRecords: [],
AliasTarget:
{ 
    HostedZoneId: obj.hostedZoneId,
    DNSName: data.Distribution.DomainName,
    EvaluateTargetHealth: false 
} */

Cert.getCname(certArn)
.then(data=>{
  console.log(data)
})
.catch(err=>console.log(err))

Domains.aws.upsertRecords(domain, )