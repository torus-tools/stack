const AWS = require('aws-sdk');
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const fs = require('fs')
const path = require('path');
const invalidateCache = require('../cache/invalidateCache')

function scanFiles(dir){
  let arrs = [];
  return new Promise(async (resolve, reject) => {
    scanDir(dir, (filePath, stat) => arrs.push(filePath))
    resolve(arrs)
  })
}

function scanDir(currentDirPath, callback) {
  var gitignore = fs.readFileSync('.torusignore', 'utf8')
  var ignorePaths = {}
  for(let path of gitignore.split('\n')) if(path.trim().length > 1) ignorePaths[path.trim()] = true
  fs.readdirSync(currentDirPath).forEach((name)=>{
    var filePath = path.join(currentDirPath, name);
    var stat = fs.statSync(filePath);
    if(!ignorePaths[filePath]) {
      if (stat.isFile()) callback(filePath, stat);
      else if (stat.isDirectory()) scanDir(filePath, callback)
    }
  });
}

/* function createFile(filePath, contents){
  return new Promise((resolve, reject) => {
    if(fs.existsSync(filePath)) fs.promises.readFile(filePath, 'utf8').then(data => resolve(data)).catch(err => reject(err))
    else {
      fs.promises.writeFile(filePath, contents)
      .then(() => resolve(contents))
      .catch(err => reject(err))
    }
  })
} */

function getFiles(root, path){
  return new Promise((resolve, reject) => {
    if(!path && root) path = root
    if(!path || path === '*' || path === '/') scanFiles('./').then(files=>resolve(files)).catch(err=>reject(err))
    else {
      var stat = fs.statSync(path)
      if(stat.isFile()) resolve([path])
      else if(stat.isDirectory()) {
        scanFiles(path).then(files=>resolve(files))
        .catch(err=>reject(err))
      }
      else reject('path doesnt exist')
    }
  })
}

function upload(bucketName, filePath, root) {
  return new Promise((resolve, reject) => {
    let ext = filePath.substring(filePath.lastIndexOf('.') + 1);
    let content_type = '';
    let keyPath = filePath;
    //console.log('keyPATH ', keyPath)
    if(root) keyPath = keyPath.substr(root.length+1, keyPath.length)
    //console.log('CORRECTED_KEYPATH ', keyPath)
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
    //console.log(params.Key)
    s3.putObject(params).promise().then(()=>resolve(keyPath))
    .catch(err => reject(err))
  })
}

function uploadFiles(domain, files, purge, updates, dir, cli){
  return new Promise((resolve, reject) => {
    let customBar = cli? cli.progress({
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      format: 'Uploading | \x1b[32m{bar}\x1b[0m | Files: {value}/{total} | ETA: {eta}s'
    }) : null
    let num = 0
    let updated_files = []
    let cached_files = []
    let new_config = {}
    let local_config = fs.existsSync('./torus/uploads.json')? JSON.parse(fs.readFileSync('./torus/uploads.json', 'utf8')):{}
    for(let path of files) {
      new_config[path] = {updated:fs.statSync(path).mtimeMs, uploaded:null}
      if(local_config[path]){
        if(new_config[path].updated > local_config[path].uploaded){
          if(local_config[path].uploaded) cached_files.push(path)
          local_config[path].updated = new_config[path].updated
          updated_files.push(path)
        }
      }
      else {
        local_config[path] = new_config[path]
        updated_files.push(path)
      }
    }
    let upload_files = updates?updated_files:files
    let invalidate_files = updates?cached_files:files
    //console.log(upload_files)
    //console.log(invalidate_files)
    if(upload_files.length > 0){
      if(cli) customBar.start(upload_files.length, 0, {speed: "N/A"});
      for(let f in upload_files){
        upload(domain, upload_files[f], dir).then(data => {
          cli? customBar.update(num+=1): console.log('uploaded '+ filepath)
          local_config[upload_files[f]].uploaded = new Date().getTime()
          if(num>=upload_files.length){
            customBar.stop()
            fs.writeFileSync('./torus/uploads.json', JSON.stringify(local_config), 'utf8')
            if(purge && invalidate_files.length > 0){
              cli?cli.action.start('Invalidating Cache'):console.log('Invalidating Cache . . .')
              invalidateCache.aws(domain, invalidate_files).then(()=>{
                cli.action.stop()
                resolve('All Done!')
              }).catch(err=>reject(err))
            }
            else resolve('All Done!')
          }
        }).catch(err=>reject(err))
      }
    }
    else resolve('No changes detected')
  })
}

module.exports = {
  getFiles,
  uploadFiles
}