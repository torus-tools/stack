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

const initialTemplate = {
  "AWSTemplateFormatVersion": "2010-09-09",
  "Resources": {}    
}

const stackResources = {
  bucket: "RootBucket",
  www: "WwwBucket",
  cdn: "CloudFrontDist",
  dns: "HostedZone",
  https: "AcmCertificate"
}

const importables = {
  "BucketPolicy":null,
  "RootBucket":"BucketName",
  "WwwBucket":"BucketName",
  "HostedZone":"HostedZoneId",
  "RecordSet":null,
  "AcmCertificate":null,
  "CloudFrontDist":"DistributionId"
}

function templateDefaults(domain, stack, config) {
  let DistributionDomain = { "Fn::GetAtt": ["CloudFrontDist", "DomainName"] }
  let awsRegion = process.env.AWS_REGION
  return {
    "RootBucket":{
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "Properties": {
        "AccessControl": "PublicRead",
        "BucketName": domain,
        "WebsiteConfiguration": {
          "ErrorDocument" : config.error,
          "IndexDocument" : config.index
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls" : false,
          "BlockPublicPolicy" : false,
          "IgnorePublicAcls" : false,
          "RestrictPublicBuckets" : false
        }
      }
    },
    "WwwBucket":{
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "Properties": {
        "BucketName": `www.${domain}`,
        "WebsiteConfiguration": {
          "RedirectAllRequestsTo": {
            "HostName" : domain,
            "Protocol" : stack.https ? "https":"http"
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
      "DeletionPolicy": "Delete",
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
                "DNSName" : stack.cdn ? DistributionDomain:`s3-website-${awsRegion}.amazonaws.com`,
                "HostedZoneId" : stack.cdn ? cloudFrontHostedZoneID: s3HostedZoneID[awsRegion]
              },
              "Name" : domain,
              "Type" : "A",
            },
            {
              "AliasTarget" : {
                "DNSName" : stack.cdn ? DistributionDomain:`s3-website-${awsRegion}.amazonaws.com`,
                "HostedZoneId" : stack.cdn ? cloudFrontHostedZoneID : s3HostedZoneID[awsRegion]
              },
              "Name" : `www.${domain}`,
              "Type" : "A",
            }
          ]
      },
      "DependsOn":["HostedZone"]
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
      "DeletionPolicy": "Delete",
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
            "ViewerProtocolPolicy" : stack.https ? "redirect-to-https":"allow-all"
          },
          "DefaultRootObject" : stack.index,
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
  stackResources,
  importables,
  templateDefaults
}