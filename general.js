
// interact with fs
const fs = require('fs');

// ADD THE VALUES TO THE VARIABLES.JSON FILE
exports.script = function addVars(jsonVar, jsonVal){
	let rawdata = fs.readFileSync('variables.json');  
	obj = JSON.parse(rawdata);
	obj[jsonVar] = jsonVal;
	jsonObj = JSON.stringify(obj);
	fs.writeFileSync('variables.json', jsonObj);
	console.log('variable saved.')
}