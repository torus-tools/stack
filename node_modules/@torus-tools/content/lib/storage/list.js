var AWS = require('aws-sdk');
var s3 = new AWS.S3({apiVersion: '2006-03-01'});

//list all objects
function aws(domain){
  return new Promise((resolve, reject)=> {
    s3.listObjects({Bucket: domain}).promise()
    .then(data=>resolve(data))
    .catch(err=>reject(err, err.stack))
  })
}

module.exports = {
  aws
}