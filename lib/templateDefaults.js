const s3HostedZoneID =  {
  "us-east-1" : "Z3AQBSTGFYJSTF",
  "us-west-1" : "Z2F56UZL2M1ACD",
  "us-west-2" : "Z3BJ6K6RIION7M",            
  "eu-west-1" : "Z1BKCTXD74EZPE",
  "ap-southeast-1" : "Z3O0J2DXBE1FTB",
  "ap-southeast-2" : "Z1WCIGYICN2BYD",
  "ap-northeast-1" : "Z2M4EHUR26P7ZW",
  "sa-east-1" : "Z31GFT0UA1I2HV",
}
const cloudFrontHostedZoneID =  "Z2FDTNDATAQYW2"

var initialTemplate = {
  "AWSTemplateFormatVersion": "2010-09-09",
  "Resources": {}    
}

const importables = {
  "BucketPolicy":false,
  "RootBucket":true,
  "WwwBucket":true,
  "HostedZone":true,
  "RecordSet":false,
  "AcmCertificate":false,
  "CloudFrontDist":true
}

function templateDefaults(domain, options) {
  let DistributionDomain = { "Fn::GetAtt": ["CloudFrontDistribution", "DomainName"] }
  let awsRegion = process.env.AWS_REGION
  return {
    "RootBucket":{
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "AccessControl": "PublicRead",
        "BucketName": domain,
        "WebsiteConfiguration": {
          "ErrorDocument" : error,
          "IndexDocument" : index
        }
      }
    },
    "WwwBucket":{
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": `www.${domain}`,
        "WebsiteConfiguration": {
          "RedirectAllRequestsTo": {
            "HostName" : domain,
            "Protocol" : https ? "https":"http"
          }
        }
      }
    },
    "BucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
          "Bucket": domain,
          "PolicyDocument": {
            "Version": "2012-10-17",
            "Statement": [
              {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": `arn:aws:s3:::${domain}/*`
              }
            ]
          }
      }
    },
    "HostedZone":{
      "Type": "AWS::Route53::HostedZone",
      "Properties": {
        "Name" : domain
      }
    },
    "RecordSet":{
      "Type": "AWS::Route53::RecordSetGroup",
      "Properties": {
          "HostedZoneName": `${domain}.`,
          "RecordSets" : [ 
            {
              "AliasTarget" : {
                "DNSName" : cdn ? DistributionDomain:`s3-website-${awsRegion}.amazonaws.com`,
                "HostedZoneId" : cdn ? cloudFrontHostedZoneID : s3HostedZoneID[awsRegion]
              },
              "Name" : domain,
              "Type" : "A",
            },
            {
              "AliasTarget" : {
                "DNSName" : cdn ? DistributionDomain:`s3-website-${awsRegion}.amazonaws.com`,
                "HostedZoneId" : cdn ? cloudFrontHostedZoneID : s3HostedZoneID[awsRegion]
              },
              "Name" : `www.${domain}`,
              "Type" : "A",
            }
          ]
      }
    },
    "AcmCertificate":{
      "Type": "AWS::CertificateManager::Certificate",
      "Properties": {
        "DomainName" : domain,
        "DomainValidationOptions" : [ 
          {
            "DomainName": domain,
            "HostedZoneId": { "Ref": "HostedZone"}
          } 
        ],
        "SubjectAlternativeNames" : [ `*.${domain}` ],
        "ValidationMethod" : "DNS"
      }
    },
    "CloudFrontDist":{
      "Type": "AWS::CloudFront::Distribution",
      "Properties": {
        "DistributionConfig":{
          "DefaultCacheBehavior" : {
            "AllowedMethods" : ["GET", "HEAD"],
            "CachedMethods" : ["GET", "HEAD"],
            "Compress" : true,
            "DefaultTTL" : 86400,
            "ForwardedValues" : {
              "QueryString" : false
            },
            "MaxTTL" : 31536000,
            "MinTTL" : 0,
            "SmoothStreaming" : false,
            "TargetOriginId" : `s3-${domain}`,
            "ViewerProtocolPolicy" : https ? "redirect-to-https":"allow-all"
          },
          "DefaultRootObject" : index,
          "Enabled" : true,
          "HttpVersion":"http2",
          "Origins" : [
            {
              "DomainName" : `${domain}.s3.${awsRegion}.amazonaws.com`,
              "Id" : `s3-${domain}`,
              "S3OriginConfig" : {
                "OriginAccessIdentity" : ""
              }
            }
          ],
          "PriceClass" : "PriceClass_All"
        }
      }
    }
  }
}

module.exports = {
  initialTemplate,
  importables,
  templateDefaults
}