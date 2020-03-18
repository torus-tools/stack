//check the status of the deployment for your website
module.exports = function checkStackStatus(domain){
  var params = {
    StackName: `${domain}Stack`
  };
  cloudformation.describeStacks(params, function(err, data) {
    if (err) throw new Error(err.stack)
    else console.log(data.Stacks[0].StackStatus)
  });
}
