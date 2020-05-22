const generateTemplate = require('./lib/generateTemplate');
const deploySite = require('././lib/deploySite');
const {DeleteStack, DeleteCert} = require('./lib/deleteSite');
const stack = require('./lib/deployStack');
const certificate = require('./lib/acmCertificate');
const exists = require('./lib/checkResource');
const upload = require('./lib/upload');

module.exports.generateTemplate = generateTemplate;
module.exports.deployStack = stack.deployStack;
module.exports.createChangeSet = stack.createChangeSet;

module.exports.requestCertificate = certificate.requestCertificate;
module.exports.describeCertificate = certificate.describeCertificate;
module.exports.validateCertificate = certificate.validateCertificate;
module.exports.createCertificate = certificate.createCertificate;
module.exports.importCertificate = certificate.importCertificate;

module.exports.stackExists = exists.stackExists;
module.exports.bucketExists = exists.bucketExists;
module.exports.distributionExists = exists.distributionExists;
module.exports.certificateExists = exists.certificateExists;
module.exports.hostedZoneExists = exists.hostedZoneExists;
module.exports.newHostedZone = exists.newHostedZone;

module.exports.deleteSite = DeleteStack;
module.exports.deleteCertificate = DeleteCert;
//module.exports.deploySite = deploySite;

module.exports.uploadFile = upload.uploadFile;
module.exports.uploadSite = upload.uploadDir;
