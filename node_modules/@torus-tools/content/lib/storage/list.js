var AWS = require('aws-sdk');
var s3 = new AWS.S3({apiVersion: '2006-03-01'});

//list all objects
function aws(bucket){
  return new Promise((resolve, reject)=> {
    var params = {Bucket: bucket}
    s3.listObjects(params).promise()
    .then(data=>console.log(data))
    .catch(err=>console.log(err, err.stack))
  })
}

module.exports = {
  aws
}