//UPLOAD THE WEBSITE TEMPLATE TO THE S3 BUCKET
const AWS = require('aws-sdk');
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const fs = require('fs')

function uploadDir(s3Path, bucketName) {					
  walkSync(s3Path, function(filePath) {
    uploadFile(bucketName, filePath)
  });
};

function walkSync(currentDirPath, callback) {
  return new Promise((resolve, reject) => {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            callback(filePath, stat);
        } 
        else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
  });
}

function uploadFile(bucketName, filePath, dir, cdn) {
  return new Promise((resolve, reject) => {
    let ext = filePath.substring(filePath.lastIndexOf('.') + 1);
    let content_type = '';
    let keyPath = filePath;
    if(dir) keyPath = keyPath.split(dir+'/', 2)[1];
    if(ext =='svg') content_type = 'image/svg+xml'
    else if(ext =='jpg' || ext =='jpeg') content_type = 'image/jpeg'
    else if(ext =='png') content_type = 'image/png'
    else if(ext =='html') content_type = 'text/html'
    else if(ext =='css') content_type = 'text/css'
    else if(ext =='js') content_type = 'application/javascript'
    else if(ext =='txt') content_type = 'text/plain'
    else if(ext =='xml') content_type = 'text/xml'
    else if(ext =='mp4') content_type = 'video/mp4' 
    let params = {
      Bucket: bucketName, 
      Key: keyPath, 
      Body: fs.readFileSync(filePath), 
      ContentType: content_type
    };
    s3.putObject(params).promise().then(()=>resolve(true))
    .catch(err => reject(err))
    //if(cdn)reset cloudfront cache
  })
}

module.exports = {
  uploadFile,
  uploadDir
}