var {createCertificate} = require('../lib/acmCertificate')
require('dotenv').config();

createCertificate('gkpty.com', 'gkptycomStack', true)