const getZone = require('./lib/zones/get')

const getNameservers = require('./lib/nameservers/get')
const updateNameservers = require('./lib/nameservers/update')

const listRecords = require('./lib/records/list')
const upsertRecords = require('./lib/records/upsert')
const deleteRecords = require('./lib/records/delete')
const deleteAllRecords = require('./lib/records/deleteAll') 
const addRecord = require('./lib/records/add')

const createRedirect = require('./lib/redirects/create')

/* 
for(let g in getNameservers){
  if(!module.exports[g]) module.exports[g] = {}
  module.exports[g].getNameservers = getNameservers[g]
}

for(let u in updateNameservers){
  if(!module.exports[u]) module.exports[u] = {}
  module.exports[u].updateNameservers = updateNameservers[u]
}
*/

module.exports.aws = {
  getZone: getZone.aws,

  getNameservers: getNameservers.aws,
  updateNameservers: updateNameservers.aws,
  
  upsertRecords: upsertRecords.aws,
  listRecords: listRecords.aws,
  deleteRecords: deleteRecords.aws,
  deleteAllRecords: deleteAllRecords.aws,
  addRecords: addRecord.aws,

  //createRedirect: createRedirect.aws
}

module.exports.godaddy = {
  //getZone: getZone.godaddy,

  getNameservers: getNameservers.godaddy,
  updateNameservers: updateNameservers.godaddy,
  
  upsertRecords: upsertRecords.godaddy,
  listRecords: listRecords.godaddy,
  deleteRecords: deleteRecords.godaddy,
  deleteAllRecords: deleteAllRecords.godaddy,
  addRecords: addRecord.godaddy,

  createRedirect: createRedirect.godaddy
}
