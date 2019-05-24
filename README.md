![Super Easy Forms](img/arjan-header.png)

[![License](http://img.shields.io/:license-mit-blue.svg?style=flat-square)](http://gkpty.mit-license.org)

Arjan is a CLI that helps you deploy resources in a practical way that makes building microservices easy and fun! When you deploy resources you also save them in a JSON file that can be parsed and read by the CLI, enabling you to connect your resources. 

**Some Basic Actions Arjan will help you complete** 
- API
  - Deploy API
  - Deploy method
  - Enable CORS
- Website
  - Deploy public site
  - Deploy www reroute bucket
- CDN
  - Deploy cloudfront
  - Deploy cloudflare
- Email endpoint
  - Add gmail account
  - Validate email with SES account
- unctions
  - Deploy lambda function from template
  - Deploy lambda function from a file
- Database
  - Deploy a NoSQL DB table
  - Deploy a SQL DB table (amazon aurora only)


## Pre-requisites

*  Make sure you have node.js and npm installed. You can checkout this [tutorial](https://medium.com/@lucaskay/install-node-and-npm-using-nvm-in-mac-or-linux-ubuntu-f0c85153e173) to install npm and node in mac, linux (debian/ubuntu).
* Have an AWS account and an IAM user with administrator access. If you don't have an AWS account, you can easily create one [here](https://portal.aws.amazon.com/billing/signup?#/start). Don't worry, most of what you do with this project will fall within the AWS free tier limit! 

## Steps
1. Clone the repository
2. Go into the directory of the project ` cd arjan `
3. create a file called .env and add the following variables. replace your-acces-key and your-secret-access-key with the keys that were displayed when you created the IAM user.
    ```
    AWS_ACCESS_KEY_ID=your-access-key
    AWS_SECRET_ACCESS_KEY=your-secret-access-key
    AWS_REGION=us-east-1
    AWS_ACCOUNT_NUMBER=your-aws-account-number
    ```
4. To find your AWS account number, go to the [AWS console support center](https://console.aws.amazon.com/support/home?)
![image 18](img/account_number.png)
5. Install all dependencies by running ` npm install`
6. Start the CLI by running ` node arjan.js `

**Currently you can only run the create-static-site command. Stay tuned as we will be adding more actions very soon!

