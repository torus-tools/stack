deploySite(domainName){
  if (/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(domainName)) {
    //execute the stack deployment
  }
  else console.log('Error. please use a correct domain name.')
}
