//const {resourceExists} = require('torus/stack')

//re-catches the file in the CDN

function aws(paths, distributionId){
  return new Promise((resolve, reject)=>{
    var params = {
      DistributionId: distributionId, 
      InvalidationBatch: {
        CallerReference: Date.now().toString(),
        Paths: {
          Quantity: paths.length,
          Items: paths
        }
      }
    };
    cloudfront.createInvalidation(params).promise()
    .then(data=>resolve(data))
    .catch(err=>reject(err))
  })
}

/* 
//cloudflare
function cloudflare(paths, zoneId){
  var url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`
  const options = {
    headers: {
      'X-Auth-Key': process.env.CLOUDFLARE_API_KEY,
      'X-Auth-Email': process.env.CLOUDFLARE_EMAIL,
      'Content-Type': 'application/json'
    }
  };
  //map paths and transfporm to this format
  var params = [
    "http://www.example.com/css/styles.css",
    {
      "url": "http://www.example.com/cat_picture.jpg",
      "headers": {
        "Origin": "https://www.cloudflare.com",
        "CF-IPCountry": "US",
        "CF-Device-Type": "desktop"
      }
    }
  ]
  axios.post(url, params, options)
  .then(response => {
    console.log(response);
  })
  .catch(error => {
    console.log(error);
  });
}
*/

module.exports = {
  aws
}