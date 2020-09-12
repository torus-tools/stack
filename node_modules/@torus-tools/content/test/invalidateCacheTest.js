const invalidateCache = require('../lib/cache/invalidateCache')

invalidateCache.aws('panamaexpedition.com', ['index.js', 'arjan.js', 'img/how-torus-stack-works.png', 'README.md'])
.then(data => console.log(data))
.catch(err => console.log(err))