<img src="https://github.com/arjan-tools/site/blob/master/img/arjan_deploy_logo.svg" alt="Arjan Localize" width="200" style="max-width:100%;">

[![License](http://img.shields.io/:license-mit-blue.svg?style=flat-square)](http://gkpty.mit-license.org)

# Arjan Deploy
A 1 command deployment solution that requires 0 knowledge, 0 effort, and most importantly 0 extra $$$.

It uses AWS cloudformation and the AWS javascript SDK under the hood to help you create and maintain modern infrastructure for your static sites/apps.

## Features
- facilitates collaboration of unlimited team-members with per-stack IAM roles
- automatically adds continous deployment with github using codepipeline
- automatically imports any existing resources in AWS for a given domain
- creates a single cloudformation template
- Saves your cloudformation changesets locally
- 99.99% SLA agreement included automatically
- its completely open source
- responsive community support 🙂

## getting started
**Prerequisites**
- An AWS account 
- node and npm
- The latest version of the Arjan CLI

To deploy a static site with a CDN and HTTPS pop up your terminal, go into your desired project `cd project_name`, and run `arjan stack create prod -u=/` 

**When using Arjan Tools you are using your own AWS account from your own machine.**

**Any charges incurred by your websites will be billed directly from AWS to your AWS account.** 

**Arjan Tools does NOT have any access to your AWS account/bill.**

## setups
For an easier development workflow we have defined some setups that include Dev, Test and Prod (production). You can customize these by additionally providing flags.
**dev → test → prod**

1. **Dev:** S3 root bucket with a public policy
2. **Test:** S3 root bucket, www reroute bucket and a route53 hosted zone.
3. **Prod:** CDN w/ Route53 DNS (https)**:** Deploys s3 bucket, route53 DNS, a cloudfront distribution and creates TLS certificates in AWS ACM.

## How it Works
Arjan Deploy produces a JSON cloudformation template with your infrastructure (as code). It deploys this template using the AWS SDK and also saves it locally in the arjan_config. 

You are free to customize the cloudformation template or its resources individually in any way you want using the AWS console/CLIs/SDKs and/or the arjan CLI/SDK. You can also push the arjan_config to github and enable other team-members (with permission) to collaborate on the stack. Arjan facilitates this process by creating a per-stack IAM policy that can easily be assigned to other users in AWS.

## Static Site architecture
Because the content in a static site doesnt have to be processed on a request basis it can be served completely from a servers cache, or a cheaper cloud based object storage solution like AWS s3. 

To have fast response times globally, https, amongst several other percs you can add a CDN (content distribution network) that fetches contet the origin (s3 bucket) and distributes it to several edge locations scattered around the globe. This places the content a lot closer to the end user and hence faster response times.
- diagram

## Pricing breakdown (from AWS)
This is a breakdown of the costs of hosting a static site in AWS

Let’s say your website uses CloudFront for a month (30 days), and the site has 1,000 visitors each day for that month. Each visitor clicked 1 page that returned a single object (1 request) and they did this once each day for 30 days. Turns out each request is 1MB for the amount of data transferred, so in total for the month that comes to 30,000MB or 29GB (1GB = 1,024MB). Half the requests are from the US and half are from Europe, so your monthly total for data transferred comes to $2.47. Also, each click is an HTTP request, so for the month that equals 30,000 HTTP requests, which comes to a total of $0.02 for the month. Adding the two values together, the total cost for using CloudFront for this example would be $2.49 for the month.

- cloudfront
  - 29GB bandwith = 2.47$
  - 30,000 http requests = .02$
- Route53 .50$
- S3 5GB storage = 0.15$
## total - 3.14$

## Programmatic Usage
