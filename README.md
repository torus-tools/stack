<img src="https://github.com/arjan-tools/site/blob/master/img/arjan_deploy_logo.svg" alt="Arjan Localize" width="200" style="max-width:100%;">

[![License](http://img.shields.io/:license-mit-blue.svg?style=flat-square)](http://gkpty.mit-license.org)

# Arjan Deploy

Arjan deploy is a tool that helps you deploy static websites to the AWS cloud using Cloudformation. The tool is modular and can be used with the Arjan CLI, or programmatically in your own node.js project. Arjan Deploy gives you several different options to deploy your static sites in AWS and it also helps you import existing AWS projects, or individual resources into your websites project.

## Why not just use the AWS SDK for JS and CloudFormation directly?

It turns out things get a bit trickier than expected when throwing in a CDN with HTTPS into the equation. As of now, to host a static site with HTTPS in AWS it requires more than one template and/or the use of multiple operations in the SDK.

## Static site architectures

Generally static sites in the cloud consist of an object storage solution (i.e. S3), a DNS (from your domain name provider or your cloud provider) a CDN or cache distribution network, and optionally may contain a digital certificate. Arjan Gives you options to add the following resources to your stack depending on your needs. 

**root**: an s3 bucket for the root domain
**dns**: Adds a Route53 Hosted zone to your stack. 
**cdn**: Adds an AWS Cloudfront distribution to your sites stack. More about Cloudfront.
**https**: creates a digital certificate for your domain with AWS ACM. If you have a route53 DNS it will automatically verify your certificate. Else you must manually verify your certificate with your DNS provider. 
**www**: a reroute bucket for www

## Usage
1. go to your project's directory `cd your_project`
2. run `arjan init PROFILE REGION`
3. If you want your site to be online while still in development you can run `arjan deploy DOMAIN create`
4. Then to update your stack to production you can run `arjan deploy DOMAIN update prod` this will add a route53 DNS, a cloudfront distribution and a verified SSL ceritifcate to your stack.
5. alternatively you can just run `arjan deploy DOMAIN create prod` from the start.

In order to deploy a production site you must have already purchased a domain from a domain name registrar and you should have their respective interface open in order to create DNS records or transfer nameservers. there are several popular options out there; we like to use namecheap because as the name suggests it, its cheap, and it also has great service.

## Programmatic Usage


## Setups

For an easier development workflow we have defined some setups that include dev, test and prod (production). you can customize these by additionally providing flags.
**dev → test → prod**


1. **Dev:** S3 root bucket with a public policy
2. **Test:** S3 root bucket, www reroute bucket and a route53 hosted zone.
3. **Prod:** CDN w/ Route53 DNS (https)**:** Deploys s3 bucket, route53 DNS, a cloudfront distribution and creates TLS certificates in AWS ACM.

**Custom Setup Examples**

1. **CDN w/ Route53 DNS (http):** Deploys s3 bucket, route53 DNS, and a cloudfront distribution.
2. **CDN w/ external DNS (http):** Deploys s3 bucket and a Cloudfront distribution. You must create a CNAME record (and reroute record) in your external DNS.
3. **CDN w/ external DNS (https)**: Deploys s3 bucket and a Cloudfront distribution and creates certificates in ACM. You must create a CNAME record (and optionally a reroute record) in your external DNS.
## Route53 DNS

Amazon Route 53 provides highly available and scalable Domain Name System (DNS), domain name registration, and health-checking web services. It is designed to give developers and businesses an extremely reliable and cost effective way to route end users to Internet applications by translating names like example.com into the numeric IP addresses, such as 192.0.2.1, that computers use to connect to each other.

AWS Route53 has a $0.50/month cost (6$ a year). Its a better option than a standard DNS because:

- Route 53 offers powerful routing policies to allow for efficient DNS requests.
- You can combine your DNS with health-checking services to route traffic to healthy endpoints or to independently monitor and/or alarm on endpoints. 
- Route 53 effectively connects user requests to infrastructure running in AWS – such as Amazon EC2 instances, Elastic Load Balancing load balancers, or Amazon S3 buckets
- can also be used to route users to infrastructure outside of AWS.
## Using an External DNS

You can only use an external DNS if you include the CDN option and exclude the route53 option. If you are using an external DNS a CNAME record pointing to the root will invalidate all other records pointing to the root; so if you have other records pointing to your root, for example mail exchange (MX) records to send/receive email with your custom domain you will have to perform some additional steps.

Instead of pointing the CNAME record to the root, you can point to the CNAME to the www subdomain. Then you can create a reroute or FWD record in your DNS provider console to reroute all http requests coming in to the root to the www.