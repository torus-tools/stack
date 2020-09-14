const list = require('./lib/storage/list')
const download = require('./lib/storage/download')
const remove = require('./lib/storage/delete')
const {uploadFiles, getFiles} = require('./lib/storage/upload')
const invalidateCache = require('./lib/cache/invalidateCache')

module.exports.listFiles = getFiles
module.exports.listContent = list.aws
module.exports.downloadContent = download.aws
module.exports.deleteContent = remove.aws
module.exports.uploadContent = uploadFiles
module.exports.invalidateCache = invalidateCache
