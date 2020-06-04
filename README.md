<img src="https://github.com/arjan-tools/site/blob/master/img/arjan_deploy_logo.svg" alt="Arjan Deploy" width="200" style="max-width:100%;">

[![License](http://img.shields.io/:license-mit-blue.svg?style=flat-square)](http://gkpty.mit-license.org)
Arjan deploy is a tool that helps you deploy static websites to the AWS cloud using Cloudformation. The tool is modular and can be used with the Arjan CLI, or programmatically in your own node.js project. Arjan Deploy gives you several different options to deploy your static sites in the AWS cloud. 

## Features

Arjan Gives you options to add the following resources to your stack depending on your needs. Arjan Deploys offers a couple of different resources or components that you can add to your static web project’s stack;
WWW: defines a reroute record from www to root.
CDN: Adds an AWS Cloudfront distribution to your sites stack. More about Cloudfront.
DNS: Adds a Route53 Hosted zone to your stack. 
HTTPS: creates a digital certificate for your domain with AWS ACM. If you have a route53 DNS it will automatically verify your certificate. Else you must manually verify your certificate with your DNS provider. 

## Usage


## Getting Started



## CLI Command

USAGE
  $ arjan deploy SITE ACTION [SETUP]

ARGUMENTS
  SITE    name of the site i.e. yoursite.com

  ACTION  (create|update|import|delete|upload) choose an action to perform. you can create, update, import your stack or upload files to your bucket.

  SETUP   (dev|test|prod|custom) [default: dev] setup for the site - dev, test, production or custom

OPTIONS
  -c, --cdn            creates a CloudFront distribution for your site.
  -e, --error=error    [default: error.html] name of the error document

  -h, --https          creates and validates a TLS certificate for your site. If you arent using a route53 DNS you must create a CNAME record manually in your DNS.

  -i, --index=index    [default: index.html] name of the index document. default is index.html

  -r, --route53        creates a Hosted Zone in route 53. Have your current DNS provider page open and ready to add a custom DNS.

  -u, --upload=upload  name of a specific file you want to upload to your site. all uploads all of the files

  -w, --www            creates a www s3 bucket that reroutes requests to the index.



## Setups

For an easier development workflow we have defined some setups that include dev, test and prod (production). you can customize these by additionally providing flags.
dev → test → prod


1. Dev: S3 root bucket with a public policy
2. Test: S3 root bucket, www reroute bucket and a route53 hosted zone.
3. Prod: CDN w/ Route53 DNS (https): Deploys s3 bucket, route53 DNS, a cloudfront distribution and creates TLS certificates in AWS ACM.



### For info read the [docs](https://arjan.tools/docs) 
