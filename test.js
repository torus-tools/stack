//load files from the .env file
require('dotenv').config();

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');

//s3 = new AWS.S3({apiVersion: '2006-03-01'});
var cloudfront = new AWS.CloudFront({apiVersion: '2018-11-05'});

route53 = new AWS.Route53({apiVersion: '2013-04-01'});
var acm = new AWS.ACM({apiVersion: '2015-12-08'});

// interact with fs
const fs = require('fs');

var params = {
  HostedZoneId: 'Z3HJLEA7MRMASY', /* required */
};
route53.listResourceRecordSets(params, function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else     console.log(data);           // successful response
});
  

