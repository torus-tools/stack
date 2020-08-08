const generateTemplate = require('./lib/generateTemplate');
const {DeleteStack, DeleteCert} = require('./lib/deleteStack');
const stack = require('./lib/deployTemplate');
const exists = require('./lib/resourceExists');

module.exports.generateTemplate = generateTemplate;
module.exports.deployStack = stack.deployStack;
module.exports.createChangeSet = stack.createChangeSet;

module.exports.stackExists = exists.stackExists;
module.exports.bucketExists = exists.bucketExists;
module.exports.distributionExists = exists.distributionExists;
module.exports.certificateExists = exists.certificateExists;
module.exports.hostedZoneExists = exists.hostedZoneExists;
module.exports.newHostedZone = exists.newHostedZone;

module.exports.deleteSite = DeleteStack;
module.exports.deleteCertificate = DeleteCert;
