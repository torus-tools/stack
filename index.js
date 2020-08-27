const generateTemplate = require('./lib/generateTemplate')
const {deployStack, deployParts, deployFull} = require('./lib/deployStack')
const {deployTemplate} = require('./lib/deployTemplate')
const deleteStack = require('./lib/deleteStack')
const stackExists = require('./lib/stackExists')
const resourceExists = require('./lib/resourceExists')

module.exports.generateTemplate = generateTemplate;
module.exports.deployStack = deployStack;
module.exports.deployParts = deployParts;
module.exports.deployFull = deployFull;
module.exports.deployTemplate = deployTemplate;
module.exports.deleteStack = deleteStack;
module.exports.stackExists = stackExists;
module.exports.resourceExists = resourceExists;


