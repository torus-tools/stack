//load files from the .env file
require('dotenv').config();

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');

const path = require("path");
const fs = require('fs');
//s3 = new AWS.S3({apiVersion: '2006-03-01'});
route53 = new AWS.Route53({apiVersion: '2013-04-01'});
var cloudfront = new AWS.CloudFront({apiVersion: '2018-11-05'});

const uniqNow = Math.floor(Math.random() * 900000000000000000).toString(28) + new Date().toISOString().replace(":","-").replace(":","-").replace(".","-") + Math.floor(Math.random() * 90000000).toString(28);

exports.script = function cloudFrontDist(domain) {
    let rawdata = fs.readFileSync('variables.json');
    obj = JSON.parse(rawdata);
    var digicert = obj.certificateArn;
    var params = {
        DistributionConfig: {
            CallerReference: uniqNow, /* required */
            Comment: 'cloudfront distribution created by arjan', /* required */
            DefaultCacheBehavior: { /* required */
                ForwardedValues: { /* required */
                    Cookies: { /* required */
                        Forward: 'none', /* required */
                        WhitelistedNames: {
                        Quantity: 0, /* required */
                        Items: [
                        ]
                    }
                },
                QueryString: false, /* required */
                Headers: {
                    Quantity: 0, /* required */
                    Items: [
                    ]
                },
                QueryStringCacheKeys: {
                    Quantity: 0, /* required */
                    Items: [
                    ]
                }
            },
            MinTTL: 0, /* required */
            TargetOriginId: `s3-${domain}`, /* required */
            TrustedSigners: { /* required */
                Enabled: false, /* required */
                Quantity: 0, /* required */
                Items: [
                ]
            },
            ViewerProtocolPolicy: 'redirect-to-https', /* required */
            AllowedMethods: {
                Items: [ /* required */
                    'GET', 'HEAD',
                ],
                Quantity: 2, /* required */
                CachedMethods: {
                    Items: [ /* required */
                    'GET', 'HEAD',
                    /* more items */
                    ],
                    Quantity: 2 /* required */
                }
            },
            Compress: true,
            DefaultTTL: 86400,
            LambdaFunctionAssociations: {
                Quantity: 0, /* required */
                Items: [
                ]
            },
            MaxTTL: 31536000,
            SmoothStreaming: false
        },
        Enabled: true, /* required */
        Origins: {
            Items: [
                {
                    DomainName: `${domain}.s3.amazonaws.com`, /* required */
                    Id: `s3-${domain}`, /* required */
                    CustomHeaders: {
                        Quantity: 0, /* required */
                        Items: [
                        ]
                    },
                    OriginPath: '',
                    S3OriginConfig: {
                        OriginAccessIdentity: '' /* required */
                    }
                },
            ],
            Quantity: 1 /* required */
        },
        Aliases: {
            Quantity: 2, /* required */
            Items: [
            domain, `www.${domain}`
            /* more items */
            ]
        },
        CacheBehaviors: {
            Quantity: 0, /* required */
            Items: [
            ]
        },
        PriceClass: 'PriceClass_All',
        Restrictions: {
            GeoRestriction: { /* required */
                Quantity: 0, /* required */
                RestrictionType: 'none', /* required */
                Items: [
                ]
            }
        },
        ViewerCertificate: {
            ACMCertificateArn: digicert,
            Certificate: digicert,
            CertificateSource: 'acm',
            MinimumProtocolVersion: 'TLSv1.1_2016',
            SSLSupportMethod: 'sni-only'
        },
        WebACLId: ''
        }
    };
    cloudfront.createDistribution(params, function(err, data) {
        if (err) {
            console.log(err, err.stack);
        }
        else {
            console.log(data);
            console.log('cloudFront distribution created succesfully.') 
            // INSERT FUNCTION THAT REPLACES RECORD SETS IN THE HOSTED ZONE FOR CLOUDFRONT RECORDS.
        }   
    });
}