
const app = require('./app');
const fs = require('fs');
const https = require('https');


//app.listen(80);

console.log('Server on port 80'); 


const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/tudominio.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/tudominio.com/fullchain.pem'),
};

https.createServer(options, app).listen(443, () => {
  console.log('Servidor HTTPS corriendo en puerto 443');
});

//const { onRequest } = require("firebase-functions/v2/https");
//const app = require("./app");

//exports.api = onRequest(app);

//console.log("Cloud Function 'api' ready to deploy");