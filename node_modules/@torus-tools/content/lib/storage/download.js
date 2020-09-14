var AWS = require('aws-sdk');
var s3 = new AWS.S3({apiVersion: '2006-03-01'});
const fs = require('fs');

/* var gitignore = fs.readFileSync('.torusignore', 'utf8')
var ignorePaths = {}
for(let path of gitignore.split('\n')) if(path.trim().length > 1) ignorePaths[path.trim()] = true */

async function createFilePath(path, output, content){
  //console.log('PATH ', path)
  let slice = path.split('/')
  let outpath = './'+output
  if(slice.length>1){
    for(let s=0; s<slice.length-1; s++){
      outpath+='/'+slice[s]
      if(!fs.existsSync(outpath)) fs.mkdirSync(outpath)
      if(s>=slice.length-2) fs.promises.writeFile(`./${output}/${path}`, content, 'utf8').catch(err => {throw new Error(err)})
    }
  }
  else fs.promises.writeFile('./downloads/'+path, content, 'utf8').catch(err => {throw new Error(err)})
}

//output: output directory to save the files in.
async function aws(domain, output, files, cli){
  if(!files || files === '/' || files === '*'){
    let fileList = await s3.listObjects({Bucket: domain}).promise()
    files = fileList.Contents
  }
  cli? cli.start(files.length, 0, {speed: "N/A"}): console.log('Downloading Files . . .')
  let num = 0
  for(let f in files){
    let params = {
      Bucket: domain, 
      Key: files[f].Key
    };
    s3.getObject(params).promise().then(data=>{
      createFilePath(params.Key, output, data.Body).then(()=>{
        cli? cli.update(num+=1): console.log('downloaded '+ params.Key)
        if(num >= files.length) {
          cli.stop()
          return 'All Done'
        }
      }).catch(err => {throw new Error(err)})
    }).catch(err => {throw new Error(err)})
  }
}


module.exports = {
  aws
}