var generateTemplate = require('../lib/generateTemplate');

generateTemplate('shugi.com', 'index.html', 'error.html', false, false, false, false)
.then((data) => {console.log(JSON.stringify(data.template))})
.catch((err) => {console.log(err)})