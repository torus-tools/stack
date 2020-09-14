//with torrents
function downloadTorrents(){
  var params = {
    Bucket: 'STRING_VALUE', /* required */
    Key: 'STRING_VALUE', /* required */
    RequestPayer: requester
  };
  return new Promise((resolve, reject)=>{
    s3.getObjectTorrent(params).promise()
    .then(data=>console.log(data))
    .catch(err=>console.log(err))
  })
}
