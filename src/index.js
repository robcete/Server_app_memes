
const app = require('./app');
const fs = require('fs');
const https = require('https');


//app.listen(80);

/////console.log('Server on port 80'); 


const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/memebookinfo.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/memebookinfo.com/fullchain.pem'),
};


const server = https.createServer(options, app);
server.listen(443, () => {
  console.log('Servidor HTTPS corriendo en puerto 443');
});
server.get('/', (req, res) => {
  res.send('¡Hola mundo HTTPS!');
});
//const { onRequest } = require("firebase-functions/v2/https");
//const app = require("./app");

//exports.api = onRequest(app);

//console.log("Cloud Function 'api' ready to deploy");