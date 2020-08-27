# Torus Tools - Domains

A promise-based SDK that standarizes interaction with various different domain registrars.

## Currently Supporting
- aws
-godaddy

**If you are interested in adding new providers create the feature request and we will add it to our pipeline; or feel free to submit your own PR** :sunglasses:

## Records Format
the records parameter has the following format
```
{
  name:"example.com",  //traffic coming into (root domain or sub-domain)
  data: "192.0.2.44",  //route traffic to somewhere (an ip or resource ARN)
  type: "CNAME",  //type of record.
  ttl: 3600   //ttl for the record if required
  alias: true|false   //depending on this value the record will either have a resourceRecords attribute or an aliasTarget attribute in AWS
}
```
## Record Types
 - A
 - AAAA
 - CAA
 - CNAME
 - MX
 - NAPTR
 - NS
 - PTR
 - SOA
 - SPF
 - SRV
 - TXT

 # API
 The API standardizes operations accross different providers. As shown in the examnple bellow, all of the methods must be used in the format `[PROVIDER].method`

```
const {godaddy} = require('@torus-tools/domains')

godaddy.getNameservers('mydomain.com')
.then(data=> console.log(data))
.catch(err=>console.log(err))
 ```

## getNameservers(domain)
- **description**: gets the nameservers for a particular domain
- **params**: (domain)
  - **domain**: STRING: REQUIRED: the root domain of your site i.e. yoursite.com
- **returns**: promise(resolve, reject)
  - **resolve**: (nameservers)
    - **nameservers**: an array of nameserver addresses
  - **reject**: (error)

## updateNameservers(domain, nameservers)
- **description**: updates the nameservers for a particular domain
- **params**: (domain)
  - **domain**: STRING: REQUIRED: the root domain of your site i.e. yoursite.com
  - **nameservers**: ARRAY: REQUIRED: an array of nameserver strings
- **returns**: promise(resolve, reject)
  - **resolve**: ('All Done')
    - **nameservers**: an array of nameserver addresses
  - **reject**: (error)

## listRecords(domain)
- **description**: updates the nameservers for a particular domain

## upsertRecords(domain, records)
- **description**: It will create or update the specified records for a given domain. if onew of the records exists it will updated, otherwise it will be created.

## deleteRecords(doamin, records)
- **description**: deletes the specified records for a given domain.

## deleteAllRecords(doamin, records)
- **description**: Deletes all DNS records for a given domain.

## createRedirect(domain, url)
- **description**: creates a 301 redirect for the given domian to a specified url.

## getZone(domain)
- **description**: gets the DNS zone Id for a given domain.