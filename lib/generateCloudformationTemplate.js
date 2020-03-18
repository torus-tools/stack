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
                    "Resource": `arn:aws:s3:::${RootBucketRef}/*`
                  }
                ]
              }
          }
      },
      "RecordSet": {
        "Type": "AWS::Route53::RecordSetGroup",
        "Properties": {
            "HostedZoneId": HostedZoneRef,
            "RecordSets" : [ 
              {
                "AliasTarget" : {
                  //modify for cloudformation
                  "DNSName" : `s3-website-${awsRegion}.amazonaws.com`,
                  "HostedZoneId" : HostedZoneRef
                },
                "Comment" : "Record for root bucket",
                "HostedZoneId" : HostedZoneRef,
                "Name" : RootBucketRef,
                "Region" : awsRegion,
                "Type" : "A"
              },
              {
                "AliasTarget" : {
                  //modify for cloudformation
                  "DNSName" : `s3-website-${awsRegion}.amazonaws.com`,
                  "HostedZoneId" : HostedZoneRef
                },
                "Comment" : "Record for www bucket",
                "HostedZoneId" : HostedZoneRef,
                "Name" : WwwBucketRef,
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
  let HostedZoneRef = HostedZoneRef;
  let HostedZone = {
    "Type": "AWS::Route53::HostedZone",
    "Properties": {
      "HostedZoneConfig" : {
        "comment": `Hosted Zone for ${RootBucketRef}`
      },
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
  //check if bucket already exists
  if(!resource.bucketExists(domain)) template.Resources["RootBucket"] = RootBucket;
  //check if www bucket already exists
  if(!resource.bucketExists('www.'+domain)) {
    if(!resource.bucketExists(domain)) WwwBucket["DependsOn"] = ["RootBucket"]; 
    template.Resources["WwwBucket"] = WwwBucket;
  }
  if(!cdn){
    //create basic Site template
    //check if a hosted zone already exists
    if(resource.hostedZoneExists()) HostedZoneRef = resource.hostedZoneExists()
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
      template.Resources.RecordSet["DependsOn"] = ["CloudFrontDistribution"];
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
          if(https) template.Resources.RecordSet["DependsOn"] = ["Certificate"];
        }
      }
    }
    template = AdvancedTemplate
  }
}