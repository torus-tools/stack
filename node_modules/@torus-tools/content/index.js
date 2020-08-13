const {uploadFiles, getFiles} = require('./lib/storage/upload')
//const download = require('./lib/download')
//const remove = require('./lib/delete')

module.exports.getFiles = getFiles
module.exports.uploadFiles = uploadFiles
//for(let d in download) module.exports[d].download = download[d]
