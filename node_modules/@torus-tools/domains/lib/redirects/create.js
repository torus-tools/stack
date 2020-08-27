require('dotenv').config()
const axios = require('axios');

function godaddy(domain, url){
  return new Promise((resolve, reject) => {
    axios.get(`https://api.godaddy.com/v1/shoppers/${process.env.GODADDY_CUSTOMER_ID}?includes=customerId`, {
      headers: {
        'Authorization': `sso-key ${process.env.GODADDY_API_KEY}:${process.env.GODADDY_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    .then(res => {
      //console.log(res)
      const params = {
        method: 'put',
        url: `https://api.godaddy.com/v2/customers/${res.data.customerId}/domains/forwards/${domain}`,
        headers: {
          'Authorization': `sso-key ${process.env.GODADDY_API_KEY}:${process.env.GODADDY_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        data: {
          type: "REDIRECT_PERMANENT",
          url: url
        }
      }
      axios(params)
      .then(data => resolve(data))
      .catch(err=> reject(err))
    }).catch(err=> reject(err))
  })
}

//namecheap create a DNS record type 301

module.exports = {
  godaddy
}