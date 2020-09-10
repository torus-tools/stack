const deleteFiles = require('../lib/storage/delete')

deleteFiles.aws('localizehtml.com')
.then(data => console.log(data))
.catch(err=> console.log(err))