const {getFiles, uploadFiles} = require('../lib/storage/upload')

let files = await getFiles().catch(err=> console.log(err))
await uploadFiles('yoursite.com', files, true, true).catch(err => console.log(err))