const AWS = require('aws-sdk');
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const fs = require('fs')
const path = require('path');

var gitignore = fs.readFileSync('.torusignore', 'utf8')
var ignorePaths = {}
for(let path of gitignore.split('\n')) if(path.trim().length > 1) ignorePaths[path.trim()] = true

function scanFiles(dir){
  let arrs = [];
  return new Promise(async (resolve, reject) => {
    scanDir(dir, (filePath, stat) => arrs.push(filePath))
    resolve(arrs)
  })
}

function scanDir(currentDirPath, callback) {
  fs.readdirSync(currentDirPath).forEach((name)=>{
    var filePath = path.join(currentDirPath, name);
    var stat = fs.statSync(filePath);
    if(!ignorePaths[filePath]) {
      if (stat.isFile()) callback(filePath, stat);
      else if (stat.isDirectory()) scanDir(filePath, callback)
    }
  });
}

function upload(bucketName, filePath, dir) {
  return new Promise((resolve, reject) => {
    let ext = filePath.substring(filePath.lastIndexOf('.') + 1);
    let content_type = '';
    let keyPath = filePath;
    if(dir) keyPath = keyPath.substr(keyPath.indexOf(dir+'/'), keyPath.length)
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
    s3.putObject(params).promise().then(()=>resolve(keyPath))
    .catch(err => reject(err))
    //if(cdn)reset cloudfront cache
  })
}

function getFiles(path){
  return new Promise((resolve, reject) => {
    let dir = null
    if(path){
      /* if(typeof path === 'array' && path.length > 1){
        for(let p in path){
          if(typeof path[p] !== 'string') reject(`path ${path[p]} is not a string`)
          else {
            var stat = fs.statSync(path[p]);
            if(!stat.isFile()) reject(`There is no file ${path[p]}`)
          }
          if(p >= path.length-1) resolve({files:path, dir:dir})
        }
      }
      else*/ 
      if(typeof path === 'string'){
        if(path === '*' || path === '/')scanFiles('./').then((files)=>resolve({files:files, dir:dir})).catch(err=>reject(err))
        else {
          var stat = fs.statSync(path);
          if(stat.isFile()) resolve({files:[path], dir:dir})
          else if(stat.isDirectory()) {
            dir = path
            scanFiles(path).then((files)=>resolve({files:files, dir:dir}))
            .catch(err=>reject(err))
          }
          else reject('path doesnt exist')
        }
      }
      else reject('path is not a string')
    }
    else scanFiles('./').then((files)=>resolve({files:files, dir:dir}))
    .catch(err=>reject(err))
  })
}

function uploadFiles(domain, files, dir){
  return new Promise((resolve, reject) => {
    for(let f=0; f<files.length; f++){
      upload(domain, files[f], dir)
      .then((filepath)=> {
        console.log('uploaded '+ filepath)
        if(f >= files.length-1) resolve('all done!')
      }).catch(err => reject(err))
    }
  })
}

module.exports = {
  getFiles,
  uploadFiles
}