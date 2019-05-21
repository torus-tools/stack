//load files from the .env file
require('dotenv').load();

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');

// Load credentials and set region from JSON file
// AWS.config.loadFromPath('./config.json');    
// Currently loading from env file

// Load the other scripts
var websiteScript = require('./website-script');
var lambdaScript = require('./lambda-script');

// Create S3 service objects
s3 = new AWS.S3({apiVersion: '2006-03-01'});
route53 = new AWS.Route53({apiVersion: '2013-04-01'});
var iam = new AWS.IAM({apiVersion: '2010-05-08'});
//var lambda = new AWS.Lambda({apiVersion: '2015-03-31'});
//var apigateway = new AWS.APIGateway({apiVersion: '2015-07-09'});

// interact with fs
const path = require("path");
const fs = require('fs');

// Package to open browser window
const open = require('open');

// package to use stdin/out
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

//converts console input to y and n
function convertInput(input) {
    var mininput =  input.toLowerCase()
    if (mininput == 'y' || mininput == 'yes') {
        output = 'y';
    }
    else if(mininput == 'n' || mininput == 'no') {
        output = 'n';
    }
    else {
        output = '';   
    }
    return output;
}

// ADD THE VALUES TO THE VARIABLES.JSON FILE
function addVars(jsonVar, jsonVal){
    let rawdata = fs.readFileSync('variables.json');  
    obj = JSON.parse(rawdata);
    obj[jsonVar] = jsonVal;
    jsonObj = JSON.stringify(obj);
    fs.writeFileSync('variables.json', jsonObj);
    console.log('variable saved.')
}

//list the CLI options
function logOptions() {
    console.log('What would you like to do next?');
    console.log('create-static-site');
    console.log('create-www-reroute');
    console.log('create-cloudfront');
    stmt1();
}
 
//welcome the user
function welcome(){
    console.log('Hello, welcome to Arjan!');
    console.log('Arjan');
    iam();
}

//User options
function stmt1(){
    readline.question(`Plase type in one of the options`, (res) => {
        switch(convertInput(res)) {
            case 'create-static-site':
                createStaticSite();
                break;
            default:
                console.log('please enter a valid yes/no response');
                stmt1();
        }
    });
}

//create the IAM role
function iam(){
    readline.question(`Have you already created an IAM user for Arjan? [Y/n]`, (res3) => {
        switch(convertInput(res3)) {
            case 'y':
                logOptions();
                break;
            case 'n':
                console.log(`please create a new IAM user and enter the AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY env variables`)
                console.log(`for more info check out https://github.com/gkpty/torus_cms`);
                (async () => {
                    await open('https://console.aws.amazon.com/iam/home?region=us-east-1#/users$new?step=details');
                })();
                stmt5();
                break;
            default:
                console.log('please enter a valid yes/no response');
                stmt3();
        }
    });
}

function stmt5(){
    readline.question(`Have you finished configuring the env variables? [Y/n]`, (res5) => {
        switch(convertInput(res5)) {
            case 'y':
                logOptions();
                break;
            default:
                console.log('please enter a valid yes/no response');
                stmt5();
        }
    });
}

function createStaticSite() {
    readline.question(`Please enter the domain name of your site ex. yourdomain.com `, (domainName) => {
        if (/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(domainName)) {
            console.log("Valid Domain Name");
            addVars('public_site', domainName, 'variables.json');
            websiteScript.script(domainName);
        } 
        else {
            console.log("Enter Valid Domain Name");
            siteFunc();
        }
    });
}

welcome();


