//UPLOAD THE WEBSITE TEMPLATE TO THE S3 BUCKET

module.exports = function uploadDir(s3Path, bucketName) {					
  walkSync(s3Path, function(filePath) {
    uploadFile(bucketName, filePath)
  });
};

function walkSync(currentDirPath, callback) {
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
}

function uploadFile(bucketName, filePath) {
  let bucketPath = filePath.substring(s3Path.length+1);
  let fext = bucketPath.substring(bucketPath.lastIndexOf('.') + 1);
  let content_type = '';
  if(fext =='svg'){
      content_type = 'image/svg+xml'
  }
  else if(fext =='jpg' || fext =='jpeg'){
      content_type = 'image/jpeg'
  }
  else if(fext =='png'){
      content_type = 'image/png'
  }
  else if(fext =='html'){
      content_type = 'text/html'
  }
  else if(fext =='css'){
      content_type = 'text/css'
  }
  else if(fext =='js'){
      content_type = 'application/javascript'
  }
  else if(fext =='txt'){
      content_type = 'text/plain'
  }
  else if(fext =='xml'){
      content_type = 'text/xml'
  }
  else if(fext =='mp4'){
      content_type = 'video/mp4'
  }
  console.log(stat);        
  let fileParams = {Bucket: bucketName, Key: bucketPath, Body: fs.readFileSync(filePath), ContentType: content_type};
  s3.putObject(fileParams, function(err, data) {
    if (err) {
      console.log(err)
    } 
    else {
      console.log(`Successfully uploaded ${bucketPath} to ${bucketName}`);
    }
  });
}