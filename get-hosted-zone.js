//load files from the .env file
require('dotenv').config();

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');

route53 = new AWS.Route53({apiVersion: '2013-04-01'});

//import general functions
var addVars = require('./general');


exports.script = function getHostedZone(domainName, callback) {
	if (/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(domainName)) {
		var params = {
			DNSName: domainName,
			MaxItems: '2',
		};
		route53.listHostedZonesByName(params, function(err, data) {
			if (err) {
				console.log(err, err.stack);
			}
			else {
				switch(data.HostedZones[0].Name) {
					case `${domainName}.`:
						var str = data.HostedZones[0].Id
						var substr = str.substring(str.lastIndexOf("/") + 1, str.length)
						console.log('hostedZoneId', substr)
						addVars.script('public_site', domainName);
						addVars.script('hostedZoneId', substr);
						callback();
						break;
					default:
						console.log('There isnt any HostedZones in route53 for this domain. Please create a hosted zone for this domain to continue.')
				}
			}     
		});
	} 
	else {
		console.log("Enter a Valid Domain Name");
		siteFunc();
	}
}
