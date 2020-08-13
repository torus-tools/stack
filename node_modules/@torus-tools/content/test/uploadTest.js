const {getFiles, uploadFiles} = require('../lib/storage/upload')

getFiles().then(files => {
  uploadFiles('gkpty.com', files.files)
  .then(data=>console.log(data))
  .catch(err => console.log(err))
}).catch(err=> console.log(err))