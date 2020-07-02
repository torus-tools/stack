const AWS = require('aws-sdk');
const s3 = new AWS.S3({apiVersion: '2006-03-01'});

module.exports = async function delFiles(domain, files){
  var listparams = {Bucket: domain};
  let delArr = []
  if(!files || files === '/'){
    let objects = await s3.listObjects(listparams).promise().catch(err => rejects(err))
    for(let obj of objects.Contents) delArr.push({Key: obj.Key})
  }
  var delparams = {
    Bucket: domain, 
    Delete: {
     Objects: files?files:delArr,
     Quiet: false
    }
   };
   let delconf = await s3.deleteObjects(delparams).promise().catch()
   return delconf
}

