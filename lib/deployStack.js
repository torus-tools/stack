// main must contain an option called force or overwrite that overwrites all existing values from the template with the default values 

// main
// check if the generated template matches an existing template with the same name
// check for existing resources for the given domain
// check if the exisitng resources array contains any resources
// if array.length > 1
  // importStack then deployStack
// else deployStack


//   deployStack
// if existing stack doesnt already contain a bucket and a DNS
  // step 1 then step 2
// else step 2

//   step 1
// deployTemplate(bucket, dns)

//   step 2
// if the DNS is included in the list of providers (===other). if its not
  // console.log('please create the nameservers manually in your domain's DNS then you can run the command again') 
  // return
// else simultaneousOps


// simultaneousOps()
// synchronous. executes 3 promises. each promise will push an attribute into an array and will check if the other two have completed by checking if the size of the array >= 3
// 1. upload content into bucket
// 2. create records automatically
// 3. deployTemplate(complete)


//   deployTemplate(template)
// check if the template is equal to the existing template
// else create a changeset then execute a changeset 

