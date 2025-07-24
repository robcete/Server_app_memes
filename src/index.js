
const app = require('./app');

app.listen(80);

console.log('Server on port 80'); 


//const { onRequest } = require("firebase-functions/v2/https");
//const app = require("./app");

//exports.api = onRequest(app);

//console.log("Cloud Function 'api' ready to deploy");