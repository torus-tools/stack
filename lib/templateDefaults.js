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

const stackResources = {
  bucket: "RootBucket",
  www: "WwwBucket",
  cdn: "CloudFrontDist",
  dns: "HostedZone",
  https: "AcmCertificate"
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

function templateDefaults(domain, stack, config) {
  let DistributionDomain = { "Fn::GetAtt": ["CloudFrontDist", "DomainName"] }
  let awsRegion = process.env.AWS_REGION
  return {
    "RootBucket":{
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "AccessControl": "PublicRead",
        "BucketName": domain,
        "WebsiteConfiguration": {
          "ErrorDocument" : config.error,
          "IndexDocument" : config.index
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
        "DomainValidationconfig" : [ 
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
    },

    //iam policy
    "IamPolicy": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "VisualEditor0",
          "Effect": "Allow",
          "Action": [
            "s3:PutAnalyticsConfiguration",
            "s3:GetObjectVersionTagging",
            "s3:CreateBucket",
            "s3:ReplicateObject",
            "s3:GetObjectAcl",
            "s3:GetBucketObjectLockConfiguration",
            "s3:DeleteBucketWebsite",
            "s3:PutLifecycleConfiguration",
            "s3:GetObjectVersionAcl",
            "s3:PutObjectTagging",
            "s3:DeleteObject",
            "s3:DeleteObjectTagging",
            "s3:GetBucketPolicyStatus",
            "s3:GetObjectRetention",
            "s3:GetBucketWebsite",
            "s3:PutReplicationConfiguration",
            "s3:DeleteObjectVersionTagging",
            "s3:PutObjectLegalHold",
            "s3:GetObjectLegalHold",
            "s3:GetBucketNotification",
            "s3:PutBucketCORS",
            "s3:GetReplicationConfiguration",
            "s3:ListMultipartUploadParts",
            "s3:PutObject",
            "s3:GetObject",
            "s3:PutBucketNotification",
            "s3:PutBucketLogging",
            "s3:GetAnalyticsConfiguration",
            "s3:PutBucketObjectLockConfiguration",
            "s3:GetObjectVersionForReplication",
            "s3:GetLifecycleConfiguration",
            "s3:GetInventoryConfiguration",
            "s3:GetBucketTagging",
            "s3:PutAccelerateConfiguration",
            "s3:DeleteObjectVersion",
            "s3:GetBucketLogging",
            "s3:ListBucketVersions",
            "s3:ReplicateTags",
            "s3:RestoreObject",
            "s3:GetAccelerateConfiguration",
            "s3:GetBucketPolicy",
            "s3:PutEncryptionConfiguration",
            "s3:GetEncryptionConfiguration",
            "s3:GetObjectVersionTorrent",
            "s3:AbortMultipartUpload",
            "s3:PutBucketTagging",
            "s3:GetBucketRequestPayment",
            "s3:GetObjectTagging",
            "s3:GetMetricsConfiguration",
            "s3:DeleteBucket",
            "s3:PutBucketVersioning",
            "s3:GetBucketPublicAccessBlock",
            "s3:ListBucketMultipartUploads",
            "s3:PutMetricsConfiguration",
            "s3:PutObjectVersionTagging",
            "s3:GetBucketVersioning",
            "s3:GetBucketAcl",
            "s3:PutInventoryConfiguration",
            "s3:GetObjectTorrent",
            "s3:PutBucketWebsite",
            "s3:PutBucketRequestPayment",
            "s3:PutObjectRetention",
            "s3:GetBucketCORS",
            "s3:GetBucketLocation",
            "s3:ReplicateDelete",
            "s3:GetObjectVersion",

            "route53:GetChange",
            "route53:GetHostedZone",
            "route53:DeleteHealthCheck",
            "route53:ListResourceRecordSets",
            "route53:DeleteHostedZone",
            "route53:ChangeResourceRecordSets",
            "route53:ListVPCAssociationAuthorizations",
            "route53:ListTagsForResource",
            "route53:DeleteVPCAssociationAuthorization",
            "route53:ListTagsForResources",
            "route53:ChangeTagsForResource",
            "route53:GetHostedZoneLimit",
            
            "cloudfront:DeleteCloudFrontOriginAccessIdentity",
            "cloudfront:CreateInvalidation",
            "cloudfront:CreateCloudFrontOriginAccessIdentity",
            "cloudfront:GetDistribution",
            "cloudfront:GetCloudFrontOriginAccessIdentity",
            "cloudfront:UpdateCloudFrontOriginAccessIdentity",
            "cloudfront:UpdateDistribution",
            "cloudfront:GetDistributionConfig",
            "cloudfront:UntagResource",
            "cloudfront:GetCloudFrontOriginAccessIdentityConfig",
            "cloudfront:TagResource",
            "cloudfront:GetInvalidation",
            "cloudfront:ListTagsForResource",
            "cloudfront:ListInvalidations",
            "cloudfront:DeleteStreamingDistribution",
            "cloudfront:DeleteDistribution",
          ],
          "Resource": [
            "arn:aws:s3:::localizehtml.com",
            "arn:aws:s3:::www.localizehtml.com",
            "arn:aws:route53:::hostedzone/Z0913756RNJK1281HDKV",
            "arn:aws:cloudfront::519275522978:distribution/EY3R01FPSNF6I"
          ]
        },
        {
          "Sid": "VisualEditor1",
          "Effect": "Allow",
          "Action": [
              "s3:GetAccessPoint",
              "s3:GetAccountPublicAccessBlock",
              "s3:ListAccessPoints",
              "s3:CreateJob",
              "s3:HeadBucket",

              "route53:ListGeoLocations",
              "route53:ListTrafficPolicyInstances",
              "route53:TestDNSAnswer",
              "route53:ListHostedZonesByName",
              "route53:GetCheckerIpRanges",
              "route53:CreateHealthCheck",
              "route53:ListTrafficPolicies",
              "route53:ListReusableDelegationSets",
              "route53:DisassociateVPCFromHostedZone",
              "route53:ListHostedZones",

              "cloudfront:CreatePublicKey",
              "cloudfront:DeleteFieldLevelEncryptionConfig",
              "cloudfront:ListCloudFrontOriginAccessIdentities",
              "cloudfront:ListFieldLevelEncryptionConfigs",
              "cloudfront:GetPublicKeyConfig",
              "cloudfront:CreateFieldLevelEncryptionProfile",
              "cloudfront:DeleteFieldLevelEncryptionProfile",
              "cloudfront:UpdateFieldLevelEncryptionConfig",
              "cloudfront:DeletePublicKey",
              "cloudfront:GetFieldLevelEncryption",
              "cloudfront:UpdateFieldLevelEncryptionProfile",
              "cloudfront:GetFieldLevelEncryptionConfig",
              "cloudfront:GetFieldLevelEncryptionProfile",
              "cloudfront:UpdatePublicKey",
              "cloudfront:GetPublicKey",
              "cloudfront:ListDistributions",
              "cloudfront:ListFieldLevelEncryptionProfiles",
              "cloudfront:CreateFieldLevelEncryptionConfig",
              "cloudfront:GetFieldLevelEncryptionProfileConfig",
              "cloudfront:ListDistributionsByWebACLId"
          ],
          "Resource": "*"
        }
      ]
    },

    //dont know the stack id
    "IamPolicy":{
      "Type" : "AWS::IAM::Policy",
      "Properties" : {
          "Groups" : [ String, ... ],
          "PolicyDocument" : {
            "Version": "2012-10-17",
            "Statement": [
                {
                  "Sid": "VisualEditor0",
                  "Effect": "Allow",
                  "Action": [
                      "cloudformation:DetectStackSetDrift",
                      "cloudformation:DetectStackDrift",
                      "cloudformation:CancelUpdateStack",
                      "cloudformation:DescribeStackResources",
                      "cloudformation:SignalResource",
                      "cloudformation:UpdateTerminationProtection",
                      "cloudformation:DescribeStackResource",
                      "cloudformation:CreateChangeSet",
                      "cloudformation:DeleteChangeSet",
                      "cloudformation:GetTemplateSummary",
                      "cloudformation:ContinueUpdateRollback",
                      "cloudformation:DescribeStackResourceDrifts",
                      "cloudformation:GetStackPolicy",
                      "cloudformation:DescribeStackEvents",
                      "cloudformation:CreateStack",
                      "cloudformation:GetTemplate",
                      "cloudformation:DeleteStack",
                      "cloudformation:TagResource",
                      "cloudformation:UpdateStack",
                      "cloudformation:DescribeChangeSet",
                      "cloudformation:UntagResource",
                      "cloudformation:ExecuteChangeSet",
                      "cloudformation:ListChangeSets",
                      "cloudformation:ListStackResources"
                  ],
                  "Resource": "arn:aws:cloudformation:us-east-1:519275522978:stack/localizehtmlcomStack/936cdcc0-e770-11ea-acc4-0e194195a24f"
                },
                {
                    "Sid": "VisualEditor1",
                    "Effect": "Allow",
                    "Action": [
                        "cloudformation:CreateUploadBucket",
                        "cloudformation:EstimateTemplateCost",
                        "cloudformation:RegisterType",
                        "cloudformation:DescribeStackDriftDetectionStatus",
                        "cloudformation:SetTypeDefaultVersion",
                        "cloudformation:DescribeType",
                        "cloudformation:ListTypes",
                        "cloudformation:DescribeAccountLimits",
                        "cloudformation:DescribeTypeRegistration",
                        "cloudformation:CreateStackSet",
                        "cloudformation:ValidateTemplate",
                        "cloudformation:DeregisterType"
                    ],
                    "Resource": "*"
                }
            ]
        },
          "PolicyName" : `${domain}CloudformationPolicy`,
          "Roles" : [ String, ... ],
          "Users" : [ String, ... ]
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