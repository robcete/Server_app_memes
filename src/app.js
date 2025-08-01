const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require ('path');
const {db} = require('./firebase')


const app = express();
// const app1 = express();

// Middleware para analizar solicitudes JSON y URL codificadas con límite de tamaño de solicitud personalizado
app.use(express.json({ limit: '50mb' })); // Cambia '10mb' al límite deseado
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Cambia '10mb' al límite deseado y 'extended' a true si lo necesitas

// Aquí puedes continuar configurando tus rutas y middleware
app.use(require("./routes/index"));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/privacy_policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/privacy_policy.html'));
});
app.get('/delete_account', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/delete_account.html'));
});



// VIEJO
// Middleware para analizar solicitudes JSON y URL codificadas
// app1.use(bodyParser.json());
// .use(bodyParser.urlencoded({ extended: true }));


// app.use(require("./routes/index"));
// app.use(express.static(path.join(__dirname, 'public')));


module.exports = app;