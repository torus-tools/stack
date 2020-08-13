var AWS = require('aws-sdk');
var s3 = new AWS.S3({apiVersion: '2006-03-01'});

//without torrents
function aws(bucket, keys){
  var params = {
    Bucket: bucket, 
    Key: key
  };
  return new Promise((resolve, reject)=>{
    if(keys){
      for(let key in keys){
        s3.getObject(params).promise()
        .then(data=>{
          if(key >= keys.length-1) resolve('All Done!')
        })
        .catch(err=>reject(err))
      }
    }
  })
}

module.exports = {
  aws
}