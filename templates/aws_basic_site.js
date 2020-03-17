module.exports = function genTemplate(DomainName, index, error){
  if(!index){
    index = 'index.html'
  }
  if(!error){
    error = 'error.html'
  }
  var template = 
  {
    "AWSTemplateFormatVersion": "2010-09-09",
    "Resources": {
      "RootBucket": {
          "Type": "AWS::S3::Bucket",
          "Properties": {
            "AccesControl": "PublicRead",
            "BucketName": DomainName,
            "WebsiteConfiguration": {
              "ErrorDocument" : error,
              "IndexDocument" : index
            }
          }
      },
      "BucketPolicy": {
          "Type": "AWS::S3::BucketPolicy",
          "Properties": {
              "Bucket": {
                  "Ref": "RootBucket"
              },
              "PolicyDocument": {
                "Version": "2012-10-17",
                "Statement": [
                  {
                    "Sid": "PublicReadGetObject",
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "s3:GetObject",
                    "Resource": { "Fn::Join" : ["", ["arn:aws:s3:::", { "Ref" : "RootBucket" } , "/*" ]]}
                  }
                ]
              }
          }
      },
      "WwwBucket": {
          "Type": "AWS::S3::Bucket",
          "Properties": {
            "BucketName": {"Fn::Join" : ["www.", { "Ref" : "RootBucket" }]},
            "WebsiteConfiguration": {
              "RedirectAllRequestsTo": {
                "HostName" : {
                  "Ref": "RootBucket"
                },
                "Protocol" : "https"
              }
            }
          },
          "DependsOn": [
              "RootBucket"
          ]
      },
      "HostedZone": {
          "Type": "AWS::Route53::HostedZone",
          "Properties": {
            "HostedZoneConfig" : {
              "comment": {"Fn::Join" : ["Hosted Zone for ", { "Ref" : "RootBucket" }]}
            },
            "Name" : { "Ref" : "RootBucket" }
          }
      }
    }
      
  }
  return template;
}
