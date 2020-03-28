var fs = require('fs');
var resource = require('./checkResource')
let s3HostedZoneID =  {
  "us-east-1" : "Z3AQBSTGFYJSTF",
  "us-west-1" : "Z2F56UZL2M1ACD",
  "us-west-2" : "Z3BJ6K6RIION7M",            
  "eu-west-1" : "Z1BKCTXD74EZPE",
  "ap-southeast-1" : "Z3O0J2DXBE1FTB",
  "ap-southeast-2" : "Z1WCIGYICN2BYD",
  "ap-northeast-1" : "Z2M4EHUR26P7ZW",
  "sa-east-1" : "Z31GFT0UA1I2HV",
}

function addToResources(array, LogicalResourceId, ResourceIdentifier, ResourceType){
  console.log(`${LogicalResourceId} already exists`);
  let resource = {
    'LogicalResourceId': LogicalResourceId,
    'ResourceIdentifier': {
      '<ResourceIdentifierPropertyKey>': ResourceIdentifier,
    },
    'ResourceType': ResourceType
  }
  array.push(resource)
}

module.exports = function genTemplate(domain, index, error, cdn, route53, https){
  if(!index){
    index = 'index.html'
  }
  if(!error){
    error = 'error.html'
  }
  let DistributionDomain = { "Fn::GetAtt": "DomainName" };
  let awsRegion = process.env.AWS_REGION;
  let RootBucketRef = domain;
  let RootBucket = {
    "Type": "AWS::S3::Bucket",
    "Properties": {
      "AccessControl": "PublicRead",
      "BucketName": domain,
      "WebsiteConfiguration": {
        "ErrorDocument" : error,
        "IndexDocument" : index
      }
    }
  };
  let WwwBucketRef = `www.${domain}`;
  let WwwBucket = {
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
  };
  let HostedZoneRef = { "Ref": "HostedZone"};
  let HostedZone = {
    "Type": "AWS::Route53::HostedZone",
    "Properties": {
      "Name" : RootBucketRef
    }
  };
  let Certificate = {
    "Type": "AWS::CertificateManager::Certificate",
    "Properties": {
      "DomainName" : RootBucketRef,
      "DomainValidationOptions" : [ 
        {
          "DomainName": RootBucketRef,
          "ValidationDomain": RootBucketRef
        } 
      ],
      "SubjectAlternativeNames" : [ `*.${RootBucketRef}` ],
      "ValidationMethod" : "DNS"
    }
  }
  var basicTemplate = 
  {
    "AWSTemplateFormatVersion": "2010-09-09",
    "Resources": {
      "BucketPolicy": {
          "Type": "AWS::S3::BucketPolicy",
          "Properties": {
              "Bucket": RootBucketRef,
              "PolicyDocument": {
                "Version": "2012-10-17",
                "Statement": [
                  {
                    "Sid": "PublicReadGetObject",
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "s3:GetObject",
                    "Resource": `arn:aws:s3:::${RootBucketRef}/*`
                  }
                ]
              }
          }
      },
      "RecordSet": {
        "Type": "AWS::Route53::RecordSetGroup",
        "Properties": {
            "HostedZoneName": `${domain}.`,
            "RecordSets" : [ 
              {
                "AliasTarget" : {
                  "DNSName" : cdn ? DistributionDomain:`s3-website-${awsRegion}.amazonaws.com`,
                  "HostedZoneId" : s3HostedZoneID[awsRegion]
                },
                "Name" : RootBucketRef,
                "Type" : "A",
              },
              {
                "AliasTarget" : {
                  "DNSName" : cdn ? DistributionDomain:`s3-website-${awsRegion}.amazonaws.com`,
                  "HostedZoneId" : s3HostedZoneID[awsRegion]
                },
                "Name" : WwwBucketRef,
                "Type" : "A",
              }
            ]
        }
      }
    }    
  }
  let ResourcesToImport = []
  let template  = basicTemplate
  //check if bucket already exists
  if(!resource.bucketExists(domain)) template.Resources["RootBucket"] = RootBucket;
  else addToResources(ResourcesToImport, 'RootBucket', domain, 'AWS::S3::Bucket');
  //check if www bucket already exists
  if(!resource.bucketExists('www.'+domain)) template.Resources["WwwBucket"] = WwwBucket;
  else addToResources(ResourcesToImport, 'WwwBucket', domain, 'AWS::S3::Bucket');
  if(!cdn){
    //create basic Site template
    if(resource.hostedZoneExists()) {
      HostedZoneRef = resource.hostedZoneExists()
      addToResources(ResourcesToImport, 'HostedZonet', HostedZoneRef, 'AWS::Route53::HostedZone')
    }
    else {
      template.Resources["HostedZone"] = HostedZone;
      template.Resources.RecordSet["DependsOn"] = ["HostedZone"];
    }
  }
  else {
    //create advanced site
    //check if a distribution already exists
    if(resource.distributionExists()) console.log('you must rename or delete the existing distribution.')
    else{
      template.Resources["CloudFrontDistribution"] = {
        "Type": "AWS::CloudFront::Distribution",
        "Properties": {
          "DistributionConfig":{
            "Aliases" : [
              RootBucketRef,
              `www.${RootBucketRef}`
            ],
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
              "ViewerProtocolPolicy" : https? "redirect-to-https":"allow-all"
            },
            "DefaultRootObject" : index,
            "Enabled" : true,
            "Origins" : [
              {
                "DomainName" : `${RootBucketRef}.s3.amazonaws.com"`,
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
      //template.Resources.RecordSet["DependsOn"] = ["CloudFrontDistribution"];
      if(https){
        template.Resources["Certificate"] = Certificate;
        template.Resources.CloudFrontDistribution.Properties.DistributionConfig["ViewerCertificate"] = {
          "AcmCertificateArn" : {"Ref": "Certificate"},
          "MinimumProtocolVersion" : "TLSv1.1_2016",
          "SslSupportMethod" : "sni-only"
        }
      }
      if(route53){
        if(resource.hostedZoneExists()) HostedZoneRef = resource.hostedZoneExists()
        else {
          template.Resources["HostedZone"] = HostedZone;
          template.Resources.CloudFrontDistribution["DependsOn"] = ["HostedZone"];
          //if(https) template.Resources.RecordSet["DependsOn"] = ["Certificate"];
        }
      }
    }
  }
  let dirName = domain.replace('.', '_')
  fs.writeFileSync(`./templates/${dirName}_template.json`, JSON.stringify(template))
  return template;
}