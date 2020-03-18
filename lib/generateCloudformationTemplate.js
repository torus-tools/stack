var resource = require('./checkResource')

module.exports = function genTemplate(domain, index, error, cdn, route53, https){
  if(!index){
    index = 'index.html'
  }
  if(!error){
    error = 'error.html'
  }
  let awsRegion = process.env.AWS_REGION
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
                    "Resource": { "Fn::Join" : ["", ["arn:aws:s3:::", RootBucketRef , "/*" ]]}
                  }
                ]
              }
          }
      },
      "RecordSet": {
        "Type": "AWS::Route53::RecordSetGroup",
        "Properties": {
            "HostedZoneId": {
                "Ref": "HostedZone"
            },
            "RecordSets" : [ 
              {
                "AliasTarget" : {
                  "DNSName" : `s3-website-${awsRegion}.amazonaws.com`,
                  "HostedZoneId" : {"Ref": "HostedZone"}
                },
                "Comment" : "Record for root bucket",
                "HostedZoneId" : {"Ref": "HostedZone"},
                "Name" : RootBucketRef,
                "Region" : awsRegion,
                "Type" : "A"
              },
              {
                "AliasTarget" : {
                  "DNSName" : `s3-website-${awsRegion}.amazonaws.com`,
                  "HostedZoneId" : {"Ref": "HostedZone"}
                },
                "Comment" : "Record for www bucket",
                "HostedZoneId" : {"Ref": "HostedZone"},
                "Name" : {"Ref":"WwwBucket"},
                "Region" : awsRegion,
                "Type" : "A"
              }
            ]
        }
      }
    }    
  }
  let template  = basicTemplate
  let RootBucketRef = domain;
  let RootBucket = {
    "Type": "AWS::S3::Bucket",
    "Properties": {
      "AccesControl": "PublicRead",
      "BucketName": domain,
      "WebsiteConfiguration": {
        "ErrorDocument" : error,
        "IndexDocument" : index
      }
    }
  };
  let WwwBucket = {
    "Type": "AWS::S3::Bucket",
    "Properties": {
      "BucketName": {"Fn::Join" : ["www.", RootBucketRef]},
      "WebsiteConfiguration": {
        "RedirectAllRequestsTo": {
          "HostName" : RootBucketRef,
          //https stuff
          "Protocol" : "https"
        }
      }
    },
    "DependsOn": [
        "RootBucket"
    ]
  };
  let HostedZone = {
    "Type": "AWS::Route53::HostedZone",
    "Properties": {
      "HostedZoneConfig" : {
        "comment": {"Fn::Join" : ["Hosted Zone for ", RootBucketRef]}
      },
      "Name" : RootBucketRef
    }
  };
  let HostedZoneRef = {"Ref": "HostedZone"}
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
      "SubjectAlternativeNames" : [ {"Fn::Join" : ["*.", RootBucketRef]} ],
      "ValidationMethod" : "DNS"
    },
    "DependsOn": [
        "CloudFrontDistribution"
    ]
  }
  if(!resource.bucketExists(domain)) template.Resources["RootBucket"] = RootBucket;
  if(!resource.bucketExists('www.'+domain)) {
    if(!resource.bucketExists(domain)) WwwBucket["DependsOn"] = ["RootBucket"]; 
    template.Resources["WwwBucket"] = WwwBucket;
  }
  if(!cdn){
    if(resource.hostedZoneExists()) HostedZoneRef = resource.hostedZoneExists()
    else {
      template.Resources["HostedZone"] = HostedZone;
      template.Resources.RecordSet["DependsOn"] = ["HostedZone"];
    }
  }
  else {
    if(resource.distributionExists()) console.log('you must rename or delete the existing distribution.')
    else{
      template.Resources["CloudFrontDistribution"] = {
        "Type": "AWS::CloudFront::Distribution",
        "Properties": {
          "DistributionConfig":{
            "Aliases" : [
              RootBucketRef,
              {"Fn::Join" : ["www.", RootBucketRef]}
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
              "TargetOriginId" : {"Fn::Join" : ["s3-", RootBucketRef]},
              //changes in https
              "ViewerProtocolPolicy" : "redirect-to-https"
            },
            "DefaultRootObject" : index,
            "Enabled" : true,
            "Origins" : [
              {
                "DomainName" : {"Fn::Join" : [RootBucketRef, ".s3.amazonaws.com"]},
                "Id" : {"Fn::Join" : ["s3-", RootBucketRef]},
                "S3OriginConfig" : {
                  "OriginAccessIdentity" : ""
                }
              }
            ],
            "PriceClass" : "PriceClass_All",
            //https stuff
            "ViewerCertificate" : {
              "AcmCertificateArn" : {"Ref": "Certificate"},
              "MinimumProtocolVersion" : "TLSv1.1_2016",
              "SslSupportMethod" : "sni-only"
            }
          }
        }
      }
      if(!resource.bucketExists('www.'+domain)) template.Resources.CloudFrontDistribution["DependsOn"] = ["WwwBucket"]
      if(https){
        template.Resources["Certificate"] = Certificate;
      }
      if(route53){
        if(resource.hostedZoneExists()) HostedZoneRef = resource.hostedZoneExists()
        else {
          template.Resources["HostedZone"] = HostedZone;
          if(https) template.Resources.RecordSet["DependsOn"] = ["Certificate"];
        }
      }
    }
    template = AdvancedTemplate
  }
}