var deleteSite = require('../lib/deleteSite');

deleteSite('azuerotourscomStack')
.then((data) => console.log(data))
.catch((err) => console.log(err))