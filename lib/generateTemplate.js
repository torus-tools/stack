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

function addToResources(array, LogicalResourceId, ResourceIdentifier, ResourceType){
  return new Promise((resolve, reject) => {
    //console.log(`${LogicalResourceId} already exists`);
    let resource = {
      'LogicalResourceId': LogicalResourceId,
      'ResourceIdentifier': {
        '<ResourceIdentifierPropertyKey>': ResourceIdentifier,
      },
      'ResourceType': ResourceType
    }
    array.push(resource)
    resolve(resource)
  });
}

module.exports = async function genTemplate(domain, index, error, www, cdn, route53, https){
    if(!index) index = 'index.html'
    if(!error) error = 'error.html'
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
        }
      }    
    }
    let ResourcesToImport = []
    let wwwDomain = 'www.'+domain;
    let CloudFrontDist = {
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
    if(https){
      //console.log(https)
      CloudFrontDist.Properties.DistributionConfig["ViewerCertificate"] = {
        "AcmCertificateArn" : https,
        "MinimumProtocolVersion" : "TLSv1.1_2016",
        "SslSupportMethod" : "sni-only"
      }
      CloudFrontDist.Properties.DistributionConfig["Aliases"] = [
        domain,
        `www.${domain}`
      ]
      //console.log(CloudFrontDist)
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
          else template.Resources["RootBucket"] = RootBucket;
        }
        if(www && !template.Resources.WwwBucket){
          let data = await checkResource.bucketExists(wwwDomain).catch(err=>reject(err))
          if(data) addToResources(ResourcesToImport, 'WwwBucket', wwwDomain, 'AWS::S3::Bucket');
          else template.Resources["WwwBucket"] = WwwBucket;
        }
        if(route53 && !template.Resources.HostedZone){
          template.Resources["RecordSet"] = RecordSet;
          let data = await checkResource.hostedZoneExists(domain).catch(err=>reject(err))
          if(data){
            HostedZoneRef = data;
            addToResources(ResourcesToImport, 'HostedZone', HostedZoneRef, 'AWS::Route53::HostedZone')
          }
          else{
            template.Resources["HostedZone"] = HostedZone;
            template.Resources.RecordSet["DependsOn"] = ["HostedZone"];
          } 
        }
        if(cdn && !template.Resources.CloudFrontDistribution){
          let data = await checkResource.distributionExists(domain).catch(err=>reject(err))
          if(data){
            DistributionDomain = data.domainName;
            addToResources(ResourcesToImport, 'CloudFrontDistribution', data.id, 'AWS::CloudFront::Distribution')
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