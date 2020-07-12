require('dotenv').config();
var AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});

function checkDomain(domainName){
  if (/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(domainName)) return true;
  else return false;
}

const checkResource = require('./checkResource')
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
const cloudFrontHostedZoneID =  {
  "us-east-1" : "Z2FDTNDATAQYW2"
}

function addToResources(array, LogicalResourceId, ResourceIdentifier, ResourceType, resourceIdentifierType){
  return new Promise((resolve, reject) => {
    //console.log(`${LogicalResourceId} already exists`);
    let resource = {
      'LogicalResourceId': LogicalResourceId,
      'ResourceIdentifier': {},
      'ResourceType': ResourceType
    }
    resource.ResourceIdentifier[resourceIdentifierType] = ResourceIdentifier
    array.push(resource)
    resolve(resource)
  });
}

module.exports = async function genTemplate(domain, index, error, www, cdn, route53, https, action){
    if(!index) index = 'index.html'
    if(!error) error = 'error.html'
    let DistributionDomain = { "Fn::GetAtt": ["CloudFrontDistribution", "DomainName"] };
    let awsRegion = process.env.AWS_REGION;
    let RootBucketRef = domain;
    let RootBucket = {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "Properties": {
        "AccessControl": "PublicRead",
        "BucketName": domain,
        "WebsiteConfiguration": {
          "ErrorDocument" : error,
          "IndexDocument" : index
        }
      }
    };
    let BucketPolicy = {
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
    }
    let WwwBucketRef = `www.${domain}`;
    let WwwBucket = {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
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
      "DeletionPolicy": "Delete",
      "Properties": {
        "Name" : RootBucketRef
      }
    };
    let RecordSet = {
      "Type": "AWS::Route53::RecordSetGroup",
      "Properties": {
          "HostedZoneName": `${domain}.`,
          "RecordSets" : [ 
            {
              "AliasTarget" : {
                "DNSName" : cdn ? DistributionDomain:`s3-website-${awsRegion}.amazonaws.com`,
                "HostedZoneId" : cdn ? cloudFrontHostedZoneID[awsRegion] : s3HostedZoneID[awsRegion]
              },
              "Name" : RootBucketRef,
              "Type" : "A",
            },
            {
              "AliasTarget" : {
                "DNSName" : cdn ? DistributionDomain:`s3-website-${awsRegion}.amazonaws.com`,
                "HostedZoneId" : cdn ? cloudFrontHostedZoneID[awsRegion] : s3HostedZoneID[awsRegion]
              },
              "Name" : WwwBucketRef,
              "Type" : "A",
            }
          ]
      }
    }
    let AcmCertificate = {
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
    }
    var template = 
    {
      "AWSTemplateFormatVersion": "2010-09-09",
      "Resources": {}    
    }
    let ResourcesToImport = []
    let wwwDomain = 'www.'+domain;
    let CloudFrontDist = {
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
            "TargetOriginId" : `s3-${RootBucketRef}`,
            "ViewerProtocolPolicy" : https ? "redirect-to-https":"allow-all"
          },
          "DefaultRootObject" : index,
          "Enabled" : true,
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
    return new Promise(async (resolve, reject) => {
      let temp = null;
      if(checkDomain(domain)){
        let stackName = domain.split('.').join('') + 'Stack'
        let stackId = await checkResource.stackExists(stackName)
        if(stackId) {
          temp = await cloudformation.getTemplate({StackName: stackId}).promise()
          template = JSON.parse(temp.TemplateBody)
        }
        //console.log(template.Resources) 
        if(!template.Resources.RootBucket){
          let data = await checkResource.bucketExists(domain).catch(err=>reject(err))
          if(data) addToResources(ResourcesToImport, 'RootBucket', domain, 'AWS::S3::Bucket');
          template.Resources["RootBucket"] = RootBucket;
        }
        if(www && !template.Resources.WwwBucket){
          let data = await checkResource.bucketExists(wwwDomain).catch(err=>reject(err))
          if(data) addToResources(ResourcesToImport, 'WwwBucket', wwwDomain, 'AWS::S3::Bucket');
          template.Resources["WwwBucket"] = WwwBucket;
        }
        if(route53){
          if(action !== 'import') {
            template.Resources["RecordSet"] = RecordSet;
            template.Resources.RecordSet["DependsOn"] = ["HostedZone"];
          }
          if(!template.Resources.HostedZone){
            let data = await checkResource.hostedZoneExists(domain).catch(err=>reject(err))
            if(data){
              HostedZoneRef = data;
              addToResources(ResourcesToImport, 'HostedZone', HostedZoneRef, 'AWS::Route53::HostedZone')
            }
            template.Resources["HostedZone"] = HostedZone;
          } 
        }
        //add the certificate and modify cloudfron dist
        if(https){
          //check if the certificate exists before
          template.Resources["AcmCertificate"] = AcmCertificate;
          CloudFrontDist.Properties.DistributionConfig["ViewerCertificate"] = {
            "AcmCertificateArn" : { "Ref": "AcmCertificate"},
            "MinimumProtocolVersion" : "TLSv1.1_2016",
            "SslSupportMethod" : "sni-only"
          }
          CloudFrontDist.Properties.DistributionConfig["Aliases"] = [
            domain,
            `www.${domain}`
          ]
          CloudFrontDist["DependsOn"] = ["AcmCertificate"];
        }
        if(cdn && !template.Resources.CloudFrontDistribution){
          let data = await checkResource.distributionExists(domain).catch(err=>reject(err))
          if(data){
            DistributionDomain = data.domainName;
            addToResources(ResourcesToImport, 'CloudFrontDistribution', data.id, 'AWS::CloudFront::Distribution', 'DistributionId')
          }
          else template.Resources["CloudFrontDistribution"] = CloudFrontDist;
        }
        //console.log('GENTEMPLATE TEMPLATE ', template)
        resolve({"template":template, "existingResources": ResourcesToImport})
      }
      else reject('invalid domain')
  });
}

/* function Response(domain, template, ResourcesToImport){
  console.log(template)
  let dirName = domain.replace('.', '_')
  let templateString = JSON.stringify(template)
  fs.writeFileSync(`./templates/${dirName}_template.json`, templateString)
  return {"template":templateString, "existingResources": ResourcesToImport}
} */