const list = require('../lib/storage/list')

list.aws('supereasyforms.com')
.then(data => console.log(data))
.catch(err=>console.log(err))