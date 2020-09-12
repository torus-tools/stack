const downloadFiles = require('../lib/storage/download')

console.time()
downloadFiles.aws('supereasyforms.com', 'downloads')
.then(data => {
  console.timeEnd()
  console.log(data)
})
.catch(err=> console.log(err))