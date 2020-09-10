const AWS = require('aws-sdk');
const s3 = new AWS.S3({apiVersion: '2006-03-01'});

async function aws(domain, files){
  var listparams = {Bucket: domain};
  let delArr = []
  if(!files || files === '/' || files === '*'){
    let objects = await s3.listObjects(listparams).promise().catch(err=>{throw new Error(err)})
    for(let obj of objects.Contents) delArr.push({Key: obj.Key})
  }
  if(delArr.length >0){
    var delparams = {
      Bucket: domain, 
      Delete: {
        Objects: files?files:delArr,
        Quiet: false
      }
    };
    return await s3.deleteObjects(delparams).promise().catch(err=>{throw new Error(err)})
  }
  else return 'No objects to delete'
}

module.exports = {
  aws
}