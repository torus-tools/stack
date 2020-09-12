const dns = require('../index')

const ns = [
  'ns-95.awsdns-54.net',
  'ns-260.awsdns-43.com',
  'ns-1873.awsdns-31.co.uk',
  'ns-1050.awsdns-02.org'
]
dns.godaddy.updateNameServers('localizehtml.com', ns).then(data=>console.log(data)).catch(err=>console.log(err))
//updateNameServers.aws('torusframework.com', ns).then(data=>console.log(data)).catch(err=>console.log(err))