const  HostedZoneRef = { "Ref": "HostedZone"}
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

const importables = {
  "RootBucket":true,
  "WwwBucket":true,
  "HostedZone":true,
  "RecordSet":false,
  "AcmCertificate":false,
  "CloudFrontDist":true
}

function templateDefaults(domain, options) {
  let RootBucketRef = domain
  let WwwBucketRef = `www.${domain}`
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
        "BucketName": `www.${RootBucketRef}`,
        "WebsiteConfiguration": {
          "RedirectAllRequestsTo": {
            "HostName" : RootBucketRef,
            "Protocol" : https ? "https":"http"
          }
        }
      }
    },
    "HostedZone":{
      "Type": "AWS::Route53::HostedZone",
      "Properties": {
        "Name" : RootBucketRef
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
              "Name" : RootBucketRef,
              "Type" : "A",
            },
            {
              "AliasTarget" : {
                "DNSName" : cdn ? DistributionDomain:`s3-website-${awsRegion}.amazonaws.com`,
                "HostedZoneId" : cdn ? cloudFrontHostedZoneID : s3HostedZoneID[awsRegion]
              },
              "Name" : WwwBucketRef,
              "Type" : "A",
            }
          ]
      }
    },
    "AcmCertificate":{
      "Type": "AWS::CertificateManager::Certificate",
      "Properties": {
        "DomainName" : RootBucketRef,
        "DomainValidationOptions" : [ 
          {
            "DomainName": RootBucketRef,
            "HostedZoneId": { "Ref": "HostedZone"}
          } 
        ],
        "SubjectAlternativeNames" : [ `*.${RootBucketRef}` ],
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
            "TargetOriginId" : `s3-${RootBucketRef}`,
            "ViewerProtocolPolicy" : https ? "redirect-to-https":"allow-all"
          },
          "DefaultRootObject" : index,
          "Enabled" : true,
          "HttpVersion":"http2",
          "Origins" : [
            {
              "DomainName" : `${RootBucketRef}.s3.${awsRegion}.amazonaws.com`,
              "Id" : `s3-${RootBucketRef}`,
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