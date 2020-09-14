var AWS = require('aws-sdk');
var cloudfront = new AWS.CloudFront({apiVersion: '2020-05-31'});

module.exports = function aws(domainName) {
  return new Promise((resolve, reject) => {
    cloudfront.listDistributions({}).promise()
    .then(data=>{
      let items = data.DistributionList.Items
      let lastElem = items.length-1
      for(let i in items){
        if(items[i].Origins.Items[0].DomainName.startsWith(domainName)){
          let exists = items[i].Id
          resolve(exists)
        }
        if(i === lastElem.toString()) resolve(null)
      }
    }).catch(err=>reject(err))
  })  
}
