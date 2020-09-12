require('dotenv').config()
var AWS = require('aws-sdk');
var route53domains = new AWS.Route53Domains({apiVersion: '2014-05-15'});
const axios = require('axios');

//update nameservers for a given domain in a given registrar
//domain must be a string that is a valid domain name
//nameservers must be an array of strings that are valid nameservers

//AWS
function aws(domain, nameservers){
  return new Promise((resolve, reject) => {
    let ns = []
    for(let n of nameservers) ns.push({Name: n})
    var params = {
      DomainName: domain,
      Nameservers: ns
    };
    route53domains.updateDomainNameservers(params).promise()
    .then(res => resolve(res))
    .catch(err => reject(err))
  })
}

//GoDaddy
function godaddy(domain, nameservers){
  return new Promise((resolve, reject) => {
    var url = `https://api.godaddy.com/v1/domains/${domain}`
    axios({
      method: 'patch',
      url: url,
      headers: {
        'Authorization': `sso-key ${process.env.GODADDY_API_KEY}:${process.env.GODADDY_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      data:{
        "nameServers": nameservers
      }
    })
    .then(res => resolve(res.data))
    .catch(err => reject(err))
  })
}

/* function namecheap(domain, nameservers){
  return new Promise((resolve, reject) => {
    let ns = nameservers.join(',')
    var url = `https://api.namecheap.com/xml.response?ApiUser=${process.env.NAMECHEAP_API_USER}&ApiKey=${process.env.NAMECHEAP_API_KEY}&UserName=${process.env.NAMECHEAP_USERNAME}&Command=namecheap.domains.dns.setCustom&ClientIp=${process.env.CLIENT_IP}&SLD=domain&TLD=com&NameServers=${ns}`
    axios.post(url)
    .then(res => resolve(res.data))
    .catch(err => reject(err))
  })
} */

module.exports = {
  aws,
  godaddy,
  //namecheap
}