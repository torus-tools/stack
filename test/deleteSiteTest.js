var deleteSite = require('../lib/deleteSite');

deleteSite('gkptycomStack')
.then((data) => console.log(data))
.catch((err) => console.log(err))