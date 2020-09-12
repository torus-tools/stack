# Torus Tools - Domains

A promise-based javascript SDK that standarizes interactions with various different domain registrars providers.

## Currently Supporting
- AWS
- Godaddy

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
 The API standardizes operations accross different providers. As shown in the example below, all of the methods must be used in the format `[PROVIDER].method`

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
- **params**: (domain, nameservers)
  - **domain**: STRING: REQUIRED: the root domain of your site i.e. yoursite.com
  - **nameservers**: ARRAY: REQUIRED: an array of nameserver strings
- **returns**: promise(resolve, reject)
  - **resolve**: ('All Done')
    - **nameservers**: an array of nameserver addresses
  - **reject**: (error)

## listRecords(domain)
- **description**: Lists the records of a particular domain
- **params**: (domain)
  - **domain**: STRING: REQUIRED: the root domain of your site i.e. yoursite.com
- **returns**: promise(resolve, reject)
  - **resolve**: ('All Done')
    - **recordSet**: an object with the record set of the given domain
  - **reject**: (error)

## upsertRecords(domain, records)
- **description**: It will create or update the specified records for a given domain. If one of the records exists it will updated, otherwise it will be created.
- **params**: (domain, records)
  - **domain**: STRING: REQUIRED: the root domain of your site i.e. yoursite.com
  - **records**: OBJECT: REQUIRED: the record set that includes:
    - Record name
    - Record type
    - Record data
    - Record ttl
- **returns**: promise(resolve, reject)
  - **resolve**: ('All Done')
    - **record**: an array with the new record data that has been created or updated
  - **reject**: (error)


## deleteRecords(domain, records)
- **description**: deletes the specified records for a given domain.
- **params**: (domain, records)
  - **domain**: STRING: REQUIRED: the root domain of your site i.e. yoursite.com
  - **records**: OBJECT: REQUIRED: the record sets that will be deleted
- **returns**: promise(resolve, reject)
  - **resolve**: ('recordSet deleted')
    - **recordSet**: an object with the record set hat has been deleted
  - **reject**: (error)


## deleteAllRecords(doamin, records)
- **description**: Deletes all DNS records for a given domain.
- **params**: (domain)
  - **domain**: STRING: REQUIRED: the root domain of your site i.e. yoursite.com
- **returns**: promise(resolve, reject)
  - **resolve**: ('All recordSets deleted')
  - **reject**: (error)

## createRedirect(domain, url)
- **description**: creates a 301 redirect for the given domian to a specified url.
- **params**: (domain, url)
  - **domain**: STRING: REQUIRED: the root domain of your site i.e. yoursite.com
  - **url**: STRING: REQUIRED: the url address you want to redirect 
- **returns**: promise(resolve, reject)
  - **resolve**: ('All Done')
    - **type**: a string with the value "REDIRECT_PERMANENT"
    - **url**: a string for the redirect url address
  - **reject**: (error)


## addRecord(domain, records)
- **description**: It will add the specified records to the given domain. 
- **params**: (domain, records)
  - **domain**: STRING: REQUIRED: the root domain of your site i.e. yoursite.com
  - **records**: OBJECT: REQUIRED: the record set that includes:
    - Record name
    - Record type
    - Record data
    - Record ttl
- **returns**: promise(resolve, reject)
  - **resolve**: ('All Done')
    - **record**: an object with the record that has been added
  - **reject**: (error)


## getZone(domain)
- **description**: gets the DNS zone Id for a given domain.
- **params**: (domain)
  - **domain**: STRING: REQUIRED: the root domain of your site i.e. yoursite.com
- **returns**: promise(resolve, reject)
  - **resolve**: ('All Done')
    - **HostedZones**: An array with the hosted zone ID of given domain.
  - **reject**: ('no hosted zones exist for the given domain')