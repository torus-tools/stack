var fs = require('fs');
var checkResource = require('./checkResource')
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
  console.log(resource)
}

module.exports = async function genTemplate(domain, index, error, cdn, route53, https, callback){
  
  //default index and error
  if(!index){
    index = 'index.html'
  }
  if(!error){
    error = 'error.html'
  }

  //definitions
  let DistributionDomain = { "Fn::GetAtt": ["CloudFrontDistribution", "DomainName"] };
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
  var template = 
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
  let wwwDomain = 'www.'+domain;
  let CloudFrontDist = {
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

  //execute conditions as a promise
    await checkResource.bucketExists(domain).then((data) =>{
      if(data) addToResources(ResourcesToImport, 'RootBucket', domain, 'AWS::S3::Bucket');
      else template.Resources["RootBucket"] = RootBucket;
    })
    await checkResource.bucketExists(wwwDomain).then((data) => {
      if(data) addToResources(ResourcesToImport, 'WwwBucket', wwwDomain, 'AWS::S3::Bucket');
      else template.Resources["WwwBucket"] = WwwBucket;
    })
      if(!cdn){
        //create basic Site template
        await checkResource.hostedZoneExists(domain).then((data)=> {
          if(data){
            HostedZoneRef = data;
            addToResources(ResourcesToImport, 'HostedZone', HostedZoneRef, 'AWS::Route53::HostedZone')
          }
          else {
            template.Resources["HostedZone"] = HostedZone;
            template.Resources.RecordSet["DependsOn"] = ["HostedZone"];
          }
        }).catch((err)=>{reject(err)})
        .then(()=> {return Response(domain, template, ResourcesToImport)})
      }
      else {
        await checkResource.distributionExists(domain).then((data)=>{
          if(data){
            DistributionDomain = data.domainName;
            addToResources(ResourcesToImport, 'CloudFrontDistribution', data.id, 'AWS::CloudFront::Distribution')
          }
          template.Resources["CloudFrontDistribution"] = CloudFrontDist;
          //with https
          if(https){
            template.Resources["Certificate"] = Certificate;
            template.Resources.CloudFrontDistribution.Properties.DistributionConfig["ViewerCertificate"] = {
              "AcmCertificateArn" : {"Ref": "Certificate"},
              "MinimumProtocolVersion" : "TLSv1.1_2016",
              "SslSupportMethod" : "sni-only"
            }
          }
          if(route53){
            checkResource.hostedZoneExists(domain).then((data)=> {
              if(data){
                HostedZoneRef = data;
                addToResources(ResourcesToImport, 'HostedZone', HostedZoneRef, 'AWS::Route53::HostedZone')
              }
              else {
                template.Resources["HostedZone"] = HostedZone;
                template.Resources.RecordSet["DependsOn"] = ["HostedZone"];
              }
            }).then(() => {
              console.log('HELLOooooo')
              return Response(domain, template, ResourcesToImport)
            })
          }
          else {
            console.log('HELLOooooo')
            return Response(domain, template, ResourcesToImport)
          }
        }) 
      }
}

function Response(domain, template, ResourcesToImport){
  let dirName = domain.replace('.', '_')
  let templateString = JSON.stringify(template)
  fs.writeFileSync(`./templates/${dirName}_template.json`, templateString)
  return {"template":templateString, "existingResources": ResourcesToImport}
}