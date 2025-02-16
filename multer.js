const multer = require('multer');
const path = require('path');

// Configura multer para manejar la carga de archivos
//const storage = multer.diskStorage({
   // destination: function (req, file, cb) {
      // Define la carpeta donde se guardarán los archivos
     // cb(null, 'uploads/')
   // },
    //filename: function (req, file, cb) {
      // Define el nombre del archivo
    //  cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    //}
  //});
  
  const subida = multer({ dest: 'subida/'});

  module.exports = {
    subida
  };
  