//load files from the .env file
require('dotenv').config();

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');

//s3 = new AWS.S3({apiVersion: '2006-03-01'});
var cloudfront = new AWS.CloudFront({apiVersion: '2018-11-05'});


var params = {
    Id: 'E3PBROMMZBLKOK' /* required */
  };
  cloudfront.getDistribution(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  });
  