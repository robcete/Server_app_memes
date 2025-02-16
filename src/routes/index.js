
const fs = require("fs");
const { format } = require('date-fns');



const {subida} = require('../../multer');

const sharp = require('sharp');

const {Router} = require("express");

const {db, admin} = require('../firebase');



function stringToBoolean(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null; // Valor no reconocido
}

const router = Router();

const bucket = admin.storage().bucket();


// Función para enviar notificación
async function enviarNotificacion(deviceToken, title, body) {
  const message = {
      notification: {
          title: title,
          body: body,
      },
      token: deviceToken,
  };

  try {
      const response = await admin.messaging().send(message);
      console.log('Notificación enviada:', response);
  } catch (error) {
      console.error('Error al enviar la notificación:', error);
  }
}



async function getDownloadURL(filePath) {
  const file = bucket.file(filePath);
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: '03-09-2026', // Fecha de expiración del enlace. Ajusta según sea necesario
  });
  return url;
}


async function obtenerPathconNombre(nombre) {
  try {

    const docRef = db.collection('foto_Perfil');
    const snapshot = await docRef.where('usuario', '==', nombre).get();
    if (snapshot.empty) {
      console.log('No se encontro el usuario.');
      return;
    } 

      const doc = snapshot.docs;

    
      const data = doc[0].data();
      const url = data.url;

      if (url) { // Verifica si la URL existe
      //  console.log("La url de vox es:", url);
         // Retorna la URL
      }
    
      return url;
  
  } catch (error) {
      console.error('Error obteniendo el usuario:', error);
  }
}

router.post('/auth1', async (req, res) => {

    try {
        const {idToken}= req.body;
        console.log("funcion iniciada: auth1");
      
       // console.log(req.body);
        //console.log(idToken);
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        // El token es válido
        const uid = decodedToken.uid;
        // Realiza cualquier otra lógica que necesites aquí
//        console.log('Autenticación exitosa');
        res.send('Autenticación exitosa');
       
      } catch (error) {
        // El token no es válido
        const {idToken}= req.body;
      
        console.log(idToken);
        console.log('Error en el token:', error);
        res.send('Token inválido');
       
    
      }
  
  });

 
  router.post('/auth', async (req, res) => {

    try {
        const { email } = req.body; // Extraer el correo electrónico del cuerpo de la solicitud
        
        console.log("funcion iniciada: auth");
 
       // console.log(email);
        const email_base_de_datos = await db.collection('usuario').where('email', '==', email).get();
       // console.log(email_base_de_datos)

        if(!email_base_de_datos.empty){
            res.send('usuario existe');
        }
        else if(email_base_de_datos.empty){
        res.send('usuario no existe');

        }
        
       
      } catch (error) {
        // El token no es válido
        const {email}= req.body;
      
        //console.log(email);
        console.log('Error:', error);
        
       
    
      }
  
  });



  
  router.post('/auth_telefono', async (req, res) => {

    try {
        const { telefono } = req.body; // Extraer el correo electrónico del cuerpo de la solicitud
        
      //  console.log(req.body);
      console.log("funcion iniciada: auth_telefono");

        //console.log(telefono);
        const telefono_base_de_datos = await db.collection('usuario').where('telefono', '==', telefono).get();
      

        if(!telefono_base_de_datos.empty){
            res.send('usuario existe');
        }
        else if(telefono_base_de_datos.empty){
        res.send('usuario no existe');

        }
        
       
      } catch (error) {
        // El token no es válido
        const {telefono}= req.body;
      
        console.log('Error:', error);
        
       
    
      }
  
  });


  router.post('/subir_loc_maps', async (req, res) => {
    try {
      
   const { direccion, lat,lng,hora,fecha,comunidad,titulo, texto} = req.body;
   //console.log(direccion);
   console.log("funcion iniciada: subir_loc_maps");

  // console.log(req.body);

   const docRef = db.collection('maps');


   const snapshot = await docRef.where('comunidad', '==', comunidad).where('direccion', '==', direccion ).where('lat', '==', lat ).where('lng', '==', lng ).get()


   if (snapshot.empty) {
   
       await docRef.add({
        direccion, lat,lng,hora,fecha,comunidad,
        titulo,texto
    })
      res.send("Localizacion subida correctamente");
    
   
  
   } 
   else{
   
    res.send("Localizacion ya subida correctamente")
        
   }
      
       
    } catch (error) {
        console.error('Error subiendo mensajes:', error);
        res.status(500).send('Error subiendo localizacion');
    }
  });
  
router.post('/up_image_2',  subida.single('file'), async (req, res) => {

  
     // Obtener la imagen 
     const imagen = req.file.path;  
     const {nombre}  = req.body; 
     
     console.log("funcion iniciada: up_image_2");
 
     //console.log(req.file);
     //console.log(nombre);

     const imageBuffer = fs.readFileSync(imagen);

     
     // Nombre de archivo único, puedes generar uno con la fecha actual, por ejemplo
     const filename = `Fotos_perfil/Perfil_Image_${Date.now()}.jpg`;
     const Path = filename;
     // Subir la imagen al almacenamiento de Cloud Storage
 
     const result = await bucket.file(filename).save(imageBuffer, {
     contentType: 'image/jpeg', // Especificar el tipo de contenido de la imagen
     });

    // console.log("El Path de vox es:", Path);
     // Retorna la URL
     const file = bucket.file(Path);
    const [foto_perfil] = await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2026', // Fecha de expiración del enlace. Ajusta según sea necesario
          });
     //console.log("La url de la imagen es:",foto_perfil);

  const docRef = db.collection('usuario');

 
  const snapshot = await docRef.where('nombre', '==', nombre).get();
  if (snapshot.empty) {
      console.log('No se encontro el usuario.');
      return;
  } 

  else{


      //const docsData = snapshot.docs.map(doc => doc.data());


      //res.send(docsData)

      const doc = snapshot.docs[0];

      //mirar bé apartir de aquí

      const id = doc.ref.id; 

    // console.log("la url de la publiacion es:",foto_perfil)


      await db.collection('/usuario').doc(id).update({
        foto_perfil
    })
    res.send('Usuario creado');


  }
  


});

router.post('/subir_tema', async (req, res) => {
  try {
      const { nombre, titulo_tema, descripcio, comunidad,fecha_publicacion } = req.body;
      console.log("funcion iniciada: subir_tema");
    
//      console.log(req.body); // Verificar el cuerpo de la solicitud

      const docRef = db.collection('usuario');



const snapshot = await docRef.where('nombre', '==', nombre).get();
if (snapshot.empty) {
   console.log('No se encontro el usuario.');
   return;
} 

else{


   //const docsData = snapshot.docs.map(doc => doc.data());


   //res.send(docsData)

   const doc = snapshot.docs[0];
   //const data  = doc.data();
   const data = doc.data();
   const nombre = data.nombre;
   const foto_perfil = data.foto_perfil;
   const usuario = {nombre,foto_perfil}

   const creador = {nombre,foto_perfil}
  // var titulo = titulo_tema

   const titulo = titulo_tema
 


   //await db.collection('temas').add({
 //   usuario,
   // titulo,
  //  comunidad
//})
const likes = [""]
const num_serie = 1
texto=descripcio
//const fecha_publicacion=admin.firestore.FieldValue.serverTimestamp() 
const comentarios = {num_serie,usuario,likes,texto,fecha_publicacion}
//const comentarios = [comentario]

 

await db.collection('temas').add({
  creador,
  comentarios,
  titulo,
  comunidad,
  num_serie
})


await db.collection('tema_foro').add({
  creador,
  comentarios,
  titulo,
  comunidad,
  num_serie
})

res.send('Tema creado');





}
 
     
    


       
     
     
  } catch (error) {
      console.error('Error subiendo el maps:', error);
      res.status(500).send('Error creando usuario');
  }
});

//router.post('/subir_publicacion',  subida.single('file'), async (req, res) => {
  router.post('/subir_publicacion',  subida.array('files',10), async (req, res) => {

  
  // Obtener la imagen

    
  const {nombre, descripcio, publicacion_nueva,categoria}  = req.body; 
  console.log("funcion iniciada: subir_publicacion");




// console.log(publicacion_nueva);
  const publicaciones = JSON.parse(publicacion_nueva);
 // console.log(req.file);
  //console.log(nombre);

  var filename =[];
  const url_publicacion = [];
  for (let i = 0; i < req.files.length; i++) {
  const imagen = req.files[i].path;
  const imageBuffer = fs.readFileSync(imagen);


  // Definir el nuevo tamaño (aumentar resolución)
const newWidth = 2800; // Ajusta según lo que necesites
const newHeight = 1500; // Mantén la proporción o ajusta manualmente

// Redimensionar la imagen con sharp
const resizedImageBuffer = await sharp(imageBuffer).resize(newWidth, newHeight, { fit: "cover" }).toBuffer(); // Ajusta el modo de escalado

 // console.log(req.files);
  
  // Nombre de archivo único, puedes generar uno con la fecha actual, por ejemplo
  const filename1 = `publicaciones/Perfil_Image_${Date.now()}.jpg`;
  const Path = filename1;
  // Subir la imagen al almacenamiento de Cloud Storage

  const result = await bucket.file(filename1).save(resizedImageBuffer, {
  contentType: 'image/jpeg', // Especificar el tipo de contenido de la imagen
  });

  filename.push(filename1);
 // console.log("El Path de vox es:", Path);
  // Retorna la URL
  const file = bucket.file(Path);
  const signedUrl = await file.getSignedUrl({
    action: 'read',
    expires: '03-09-2100', // Fecha de expiración del enlace
  });
 url_publicacion.push(signedUrl[0]);
  //console.log("La url de la imagen es:",url_publicacion);
      

}
const docRef = db.collection('usuario');



const snapshot = await docRef.where('nombre', '==', nombre).get();
if (snapshot.empty) {
   console.log('No se encontro el usuario.');
   return;
} 

else{


   //const docsData = snapshot.docs.map(doc => doc.data());


   //res.send(docsData)

   const doc = snapshot.docs[0];
   //const data  = doc.data();
   const data = doc.data();
   const nombre = data.nombre;
   const foto_perfil = data.foto_perfil;
   const usuario = {nombre,foto_perfil}
   //mirar bé apartir de aquí

   const id = doc.ref.id; 

   //console.log("El usuario de la publiacion es:",usuario)


   const num_coment = 0
  // const num_likes = 0
   const num_compartits = 0
   //const categoria = 1

   const num_likes = ['""'];
   //admin.firestore.FieldValue.serverTimestamp() 
   // Obtener la fecha actual
const now = new Date();

// Formatear la fecha
const formattedDate = format(now, 'dd-MM-yyyy HH:mm:ss');

if(publicaciones.empty){
  const publicacion = {usuario,categoria, descripcio, url_publicacion, num_coment, num_compartits, fecha_publicacion: formattedDate,num_likes}

  const publicaciones = [publicacion]
}
else{
  const publicacion = {categoria, fecha_publicacion: formattedDate,num_likes}

   publicaciones.push(publicacion)
}
   await db.collection('publicaciones').add({
    usuario,
    categoria,
    descripcio,
    url_publicacion,
    num_coment,
    num_compartits,
    fecha_publicacion: formattedDate,
    num_likes,
    filename
  })
  await db.collection('/usuario').doc(id).update({
    publicaciones
});
  res.send('Publicacion subida correctamente');

}



});


router.post('/subir_publicacion/history',  subida.array('files',10), async (req, res) => {

  
  // Obtener la imagen

    
  const {nombre, categoria_nueva}  = req.body; 
  console.log("funcion iniciada: subir_publicacion/history");

  const visto = ['""'];


  var filename = []
  const categoria = categoria_nueva


  var filename1 =""
  const url_publicacion = [];
  for (let i = 0; i < req.files.length; i++) {
  const imagen = req.files[i].path;
  const imageBuffer = fs.readFileSync(imagen);

  //console.log(req.files);
  
  // Nombre de archivo único, puedes generar uno con la fecha actual, por ejemplo
  filename1 = `history/Perfil_Image_${Date.now()}.jpg`;
  const Path = filename1;
  // Subir la imagen al almacenamiento de Cloud Storage

  const result = await bucket.file(filename1).save(imageBuffer, {
  contentType: 'image/jpeg', // Especificar el tipo de contenido de la imagen
  });

  filename.push(filename1);
 // console.log("El Path de vox es:", Path);
  // Retorna la URL
  const file = bucket.file(Path);
  const signedUrl = await file.getSignedUrl({
    action: 'read',
    expires: '03-09-2100', // Fecha de expiración del enlace
  });
 url_publicacion.push(signedUrl[0]);
  //console.log("La url de la imagen es:",url_publicacion);
      

}
const docRef = db.collection('usuario');



const snapshot = await docRef.where('nombre', '==', nombre).get();
if (snapshot.empty) {
   console.log('No se encontro el usuario.');
   return;
} 

else{


   //const docsData = snapshot.docs.map(doc => doc.data());


   //res.send(docsData)

   const doc = snapshot.docs[0];
   //const data  = doc.data();
   const data = doc.data();
   const nombre = data.nombre;
   const foto_perfil = data.foto_perfil;
   const usuario = {nombre,foto_perfil}
   //mirar bé apartir de aquí

   const id = doc.ref.id; 

   //console.log("El usuario de la publiacion es:",usuario)


 

   const num_likes = ['""'];
  
  const now = admin.firestore.Timestamp.now();



// Convertir el timestamp actual a un valor en milisegundos
const nowMillis = now.toDate().getTime(); // Convertir a Date y obtener milisegundos

// Sumar un día (1 día = 24 horas x 60 minutos x 60 segundos x 1000 milisegundos)
const oneDayInMillis = 1 * 24 * 60 * 60 * 1000;
const expira_en = admin.firestore.Timestamp.fromMillis(nowMillis + oneDayInMillis);
const ahora = new Date();

// Formatear la fecha
const formattedDate = format(ahora, 'dd-MM-yyyy HH:mm:ss');
   await db.collection('history').add({
    usuario,
    categoria,
    url_publicacion,
    fecha_publicacion: formattedDate,
    num_likes,
    visto,
    expira_en,
    filename
  });



  res.send('Publicacion subida correctamente');

}



});


router.post('/subir_publicacion/video',  subida.single('file'), async (req, res) => {

  
  // Obtener la imagen 
  const video = req.file.path;  
  const {nombre, descripcio, publicacion_nueva,categoria_nueva}  = req.body; 
  console.log("funcion iniciada: subir_publicacion/video");

  const categoria = parseInt(categoria_nueva,10)
 //console.log(publicacion_nueva);
  const publicaciones = JSON.parse(publicacion_nueva);
 // console.log(req.file);
  //console.log(nombre);

  const videoBuffer = fs.readFileSync(video);

  
  // Nombre de archivo único, puedes generar uno con la fecha actual, por ejemplo
  const filename = `videos/Video_date_at_${Date.now()}.mp4`;
  const Path = filename;
  // Subir el video al almacenamiento de Cloud Storage

  const result = await bucket.file(filename).save(videoBuffer, {
  contentType: 'video/mp4', // Especificar el tipo de contenido de la imagen
  });

 // console.log("El Path de vox es:", Path);
  // Retorna la URL
  const file = bucket.file(Path);
 const [url_publicacion] = await file.getSignedUrl({
     action: 'read',
     expires: '03-09-2026', // Fecha de expiración del enlace. Ajusta según sea necesario
       });
  //console.log("La url de la imagen es:",url_publicacion);

const docRef = db.collection('usuario');



const snapshot = await docRef.where('nombre', '==', nombre).get();
if (snapshot.empty) {
   console.log('No se encontro el usuario.');
   return;
} 

else{


   //const docsData = snapshot.docs.map(doc => doc.data());


   //res.send(docsData)

   const doc = snapshot.docs[0];
   //const data  = doc.data();
   const data = doc.data();
   const nombre = data.nombre;
   const foto_perfil = data.foto_perfil;
   const usuario = {nombre,foto_perfil}
   //mirar bé apartir de aquí

   const id = doc.ref.id; 

   //console.log("El usuario de la publiacion es:",usuario)


   const num_coment = 0
  // const num_likes = 0
   const num_compartits = 0
   //const categoria = 1

   const num_likes = ['""'];
   //admin.firestore.FieldValue.serverTimestamp() 
   // Obtener la fecha actual
const now = new Date();

// Formatear la fecha
const formattedDate = format(now, 'dd-MM-yyyy HH:mm:ss');

if(publicaciones.empty){
  const publicacion = {usuario,categoria, descripcio, url_publicacion, num_coment, num_compartits, fecha_publicacion: formattedDate,num_likes}

  const publicaciones = [publicacion]
}
else{
  const publicacion = {usuario,categoria, descripcio, url_publicacion, num_coment, num_compartits, fecha_publicacion: formattedDate,num_likes}

   publicaciones.push(publicacion)
}
   await db.collection('publicaciones').add({
    usuario,
    categoria,
    descripcio,
    url_publicacion,
    num_coment,
    num_compartits,
    fecha_publicacion: formattedDate,
    num_likes
  })
  await db.collection('/usuario').doc(id).update({
    publicaciones
});
  res.send('Publicacion subida correctamente');

}



});

router.post('/subir_comunidad',  subida.single('file'), async (req, res) => {

  
  // Obtener la imagen 
  const imagen = req.file.path;  
  const {nombre, descripcion, creador,foto_perfil_usuario,comunidad_publica}  = req.body; 
  
  const publica = stringToBoolean(comunidad_publica);
 // console.log(req.body);
 console.log("funcion iniciada: subir_comunidad");

  const nombre_base_de_datos = await db.collection('comunidades').where('nombre', '==', nombre).get();

  if(!nombre_base_de_datos.empty){
  
    res.send('El nombre ya existe');
}
else{

     
 // console.log(req.file);
  //console.log(nombre);

  const imageBuffer = fs.readFileSync(imagen);

  
  // Nombre de archivo único, puedes generar uno con la fecha actual, por ejemplo
  const filename = `comunidades/foto_perfil/Perfil_Image_${Date.now()}.jpg`;
  const Path = filename;
  // Subir la imagen al almacenamiento de Cloud Storage

  const result = await bucket.file(filename).save(imageBuffer, {
  contentType: 'image/jpeg', // Especificar el tipo de contenido de la imagen
  });

  //console.log("El Path de vox es:", Path);
  // Retorna la URL
  const file = bucket.file(Path);
 const [url_publicacion] = await file.getSignedUrl({
     action: 'read',
     expires: '03-09-2026', // Fecha de expiración del enlace. Ajusta según sea necesario
       });
//  console.log("La url de la imagen es:",url_publicacion);

//const docRef = db.collection('usuario');



//const snapshot = await docRef.where('nombre', '==', nombre).get();
//if (snapshot.empty) {
 //  console.log('No se encontro el usuario.');
  // return;
//} 

//else{


  // const docsData = snapshot.docs.map(doc => doc.data());


  // res.send(docsData)

  // const doc = snapshot.docs[0];
  // const miembro_nuevo  = doc.data();
   //const data = doc.data();
   //const nombre = data.nombre;
   //const foto_perfil = data.foto_perfil;
  
   //mirar bé apartir de aquí

   //const id = doc.ref.id; 

   const usuario = {
    nombre:creador,
    foto_perfil:foto_perfil_usuario
   }
   const foto_perfil = url_publicacion

   const Miembros = [usuario];
  

// Obtener la fecha actual
const now = new Date();

// Formatear la fecha
const formattedDate = format(now, 'dd-MM-yyyy HH:mm:ss');
   await db.collection('comunidades').add({
  
    nombre,
    descripcion,
    foto_perfil,
    Miembros,
   creador,
   publica,
   fecha_creacion:formattedDate

  })
  res.send('Comunidad subida correctamente');

}

//}

});






router.post('/comunidad_cambiar_publica', async (req, res) => {

  
  // Obtener la imagen 
  const {nombre, comunidad_publica, creador}  = req.body; 
  
  const numero = toString(comunidad_publica);
  const publica = numero === 1;
  console.log("publica:",publica)

  console.log(req.body);
 // console.log(req.body);
 console.log("funcion iniciada: comunidad_cambiar_publica");

  const snapshot = await db.collection('comunidades').where('nombre', '==', nombre).get();

  if(!snapshot.empty){


      const doc = snapshot.docs[0];
      

  

      const id = doc.ref.id; 



      await db.collection('/comunidades').doc(id).update({
        publica
    });


    res.send('Comunidad modificada correctamente');
}
else{

   console.log('No se ha encontrado la comunidad');

  res.send('No se ha encontrado la comunidad');

}

//}

});


router.post('/nuevo_miembro',  subida.single('file'), async (req, res) => {

  
  // Obtener la imagen 
    
  const {nombre, Miembros, Nueva_Soli, eliminar}  = req.body; 
  
//  console.log(req.body);
console.log("funcion iniciada: nuevo_miembro");

  const Solicitudes = Nueva_Soli.filter(item => item.nombre !== eliminar.nombre);

//  console.log(req.body);

  const nombre_base_de_datos = await db.collection('comunidades').where('nombre', '==', nombre).get();

  if(!nombre_base_de_datos.empty){

    const doc = nombre_base_de_datos.docs[0];

    //mirar bé apartir de aquí

    const id = doc.ref.id; 

    await db.collection('/comunidades').doc(id).update({
      Miembros,
      Solicitudes
  })

    res.send('Solicitud subida correctamente');
   
}


});








router.post('/nueva_solicitud',  subida.single('file'), async (req, res) => {

  
  // Obtener la imagen 
  console.log("funcion iniciada: nueva_solicitud");
   
  const {Comunidad, usuario_iniciado}  = req.body; 
  
  //console.log(req.body);

  const nombre_base_de_datos = await db.collection('comunidades').where('nombre', '==', Comunidad.nombre).get();

  if(!nombre_base_de_datos.empty){

    const doc = nombre_base_de_datos.docs[0];

    //mirar bé apartir de aquí

    const id = doc.ref.id; 
const Solicitudes = Comunidad.Solicitudes
    await db.collection('/comunidades').doc(id).update({
      Solicitudes
  })

    res.send('Solicitud subida correctamente');
   
}



const docRef_3 = db.collection('usuario');
const usuario_token = await docRef_3.where('nombre', '==', Comunidad.creador.nombre).get();

const token = usuario_token.docs[0].data().token;

const titulo = "Has recibido un like"
const texto = "El usuario:,"+usuario_iniciado.nombre+" ha solicitado entrar en la Comunidad:"+Comunidad.nombre
enviarNotificacion(token,titulo,texto)




const usuario_likeado = await docRef_3.where('nombre', '==', Comunidad.creador.nombre).get();
const nombre_usuario_likeado = usuario_likeado.docs[0].data().nombre;
const foto_perfil_usuario_likeado= usuario_likeado.docs[0].data().foto_perfil;

const usuario = {
  nombre:nombre_usuario_likeado,
  foto_perfil:foto_perfil_usuario_likeado
}
const now = admin.firestore.Timestamp.now();

const expires_at = admin.firestore.Timestamp.fromMillis(now.toMillis() + 6 * 24 * 60 * 60 * 1000);
await db.collection('/Notificaciones').add({
 usuario,
 titulo,
 texto,
 expires_at

})

});



  router.post('/up_image',  subida.single('file'), async (req, res) => {
    try {

      // Obtener la imagen 
      const imagen = req.file.path;  
      const {usuario}  = req.body; 
      
      console.log("funcion iniciada: up_image");

//      console.log(req.file);
//      console.log(usuario);

      const imageBuffer = fs.readFileSync(imagen);

      
      // Nombre de archivo único, puedes generar uno con la fecha actual, por ejemplo
      const filename = `Fotos_perfil/Perfil_Image_${Date.now()}.jpg`;
      const url = filename;
      // Subir la imagen al almacenamiento de Cloud Storage
  
      const result = await bucket.file(filename).save(imageBuffer, {
      contentType: 'image/jpeg', // Especificar el tipo de contenido de la imagen
      });

      await db.collection('foto_Perfil').add({
       usuario,
       url
    })

          

    // Subir la imagen al almacenamiento de Cloud Storage
   
     
      console.log('Imagen subida correctamente a Cloud Storage');
      // Enviar una respuesta exitosa
      res.send('Imagen subida correctamente a Cloud Storage');
    } catch (error) {
      // Manejar cualquier error que pueda ocurrir
      console.error('Error al subir la imagen:', error);
      res.status(500).send('Error al subir la imagen');
    }
  });


 
router.post('/bajar_imagen', async (req, res) => {
  const { usuario } = req.body
 // console.log('usuario:',usuario);

 console.log("funcion iniciada: bajar_imagen");

  const docRef = db.collection('foto_Perfil');
    const snapshot = await docRef.where('usuario', '==', usuario).get();
    if (snapshot.empty) {
      console.log('No se encontro el usuario.');
      return;
    } 

      const doc = snapshot.docs;

    
      const data = doc[0].data();
      const Path = data.url;

      if (!Path.empty) { // Verifica si la URL existe
        //console.log("El Path de vox es:", Path);
         // Retorna la URL
         const file = bucket.file(Path);
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: '03-09-2026', // Fecha de expiración del enlace. Ajusta según sea necesario
              });
       //  console.log("La url de la imagen es:",url);
         res.send('Usuario creado');
      }

});


router.post('/bajar_publicacion', async (req, res) => {
  const { descripcio ,nombre } = req.body
  //console.log(req.body);
  console.log("funcion iniciada: bajar_publicacion");

  
  const docRef = db.collection('publicaciones');
 // const snapshot = await docRef.where('descripcio', '==', descripcio).get();

  const snapshot = await docRef.get();
  if (snapshot.empty) {
      console.log('No se encontro la publicacion.');
      return;
  } 

  else{


      const docsData = snapshot.docs.map(doc => doc.data());
  

      res.send(docsData)

  }

   

   

});


router.post('/eliminar_publicacion', async (req, res) => {
  const { descripcio ,nombre, fecha_publicacion} = req.body
  //console.log(req.body);
  console.log("funcion iniciada: eliminar_publicacion");

  
  const docRef = db.collection('publicaciones');
 // const snapshot = await docRef.where('descripcio', '==', descripcio).get();

  const snapshot = await docRef.where('nombre', '==', nombre).where('descripcio', '==', descripcio).get();
  if (snapshot.empty) {
      console.log('No se encontro la publicacion.');
      return;
  } 

  else{


    const docsData = snapshot.docs[0](doc => {
      const id = doc.ref.id
      const { filename } = doc.data(); // Obtén el array de filenames
      if (Array.isArray(filename)) {
  
        
        filename.forEach(file => {
          bucket.file(file).delete();
        });
      }
  
  
  
       db.collection('/publicaciones').doc(id).delete();
  
    });

    res.send("Publicacion eliminada");

  }

   

   

});


router.post('/eliminar_usuario', async (req, res) => {
  const {nombre} = req.body
  //console.log(req.body);
  console.log("funcion iniciada: eliminar_usuario");


  //ELIMINAR PUBLICACIONES
  
  const docRef = db.collection('publicaciones');

  const snapshot = await docRef.where('nombre', '==', nombre).get();
  if (snapshot.empty) {
      console.log('No se encontro la publicacion.');
      return;
  } 

  else{

    const docsData = snapshot.docs.map(doc => {
      const id = doc.ref.id
      const { filename } = doc.data(); // Obtén el array de filenames
      if (Array.isArray(filename)) {
  
        
        filename.forEach(file => {
          bucket.file(file).delete();
        });
      }
  
  
  
      db.collection('/publicaciones').doc(id).delete();
  
    });
   

    res.send("Publicacion eliminada");

  }
    //ELIMINAR NOTIFICACIONES

  const docRef2 = db.collection('publicaciones');

  const snapshot2 = await docRef2.where('nombre', '==', nombre).get();
  if (snapshot2.empty) {
      console.log('No se encontro la publicacion.');
      return;
  } 

  else{


    const docsData = snapshot2.docs[0](doc => {
      const id = doc.ref.id
     
  
  
  
       db.collection('/Notificaciones').doc(id).delete();
  
    });



  }
    //ELIMINAR USUARIO

    const docRef3 = db.collection('usuario');

    const snapshot3 = await docRef3.where('nombre', '==', nombre).get();
    if (snapshot2.empty) {
        console.log('No se encontro la publicacion.');
        return;
    } 
  
    else{
  
  
      const docsData = snapshot3.docs[0](doc => {
        const id = doc.ref.id
       
    
    
    
         db.collection('/usuario').doc(id).delete();
    

      });


      
      const docRef = db.collection('mensaje_final');
      const snapshot_usuario_1 = await docRef.where('usuario_1.nombre','==', nombre).get();

      const snapshot_usuario_2 = await docRef.where('usuario_2.nombre','==', nombre).get();





      snapshot_usuario_1.docs[0](doc => {
        const id = doc.ref.id
       
    
    
    
         db.collection('/mensaje_final').doc(id).delete();
    

      });  
      
      snapshot_usuario_2.docs[0](doc => {
        const id = doc.ref.id
       
    
    
    
         db.collection('/mensaje_final').doc(id).delete();
    

      });


      const docRef_men = db.collection('mensajes_privados');
      const snapshot_usuario_1_men = await docRef_men.where('usuario_1.nombre','==', nombre).get();

      const snapshot_usuario_2_men = await docRef_men.where('usuario_2.nombre','==', nombre).get();

      snapshot_usuario_1_men.docs[0](doc => {
        const id = doc.ref.id
       
    
    
    
         db.collection('/mensajes_privados').doc(id).delete();
    

      });
      snapshot_usuario_2_men.docs[0](doc => {
        const id = doc.ref.id
       
    
    
    
         db.collection('/mensajes_privados').doc(id).delete();
    

      });

      res.send("Usuario eliminado");

  }

   

});
router.post('/editar_publicacion', async (req, res) => {
  const { descripcio ,nombre, desc_antigua} = req.body
  //console.log(req.body);
  console.log("funcion iniciada: editar_publicacion");

  
  const docRef = db.collection('publicaciones');
 // const snapshot = await docRef.where('descripcio', '==', descripcio).get();

  const snapshot = await docRef.where('usuario.nombre', '==', nombre).where('descripcio', '==', desc_antigua).get();
  if (snapshot.empty) {
      console.log('No se encontro la publicacion.');
      return;
  } 

  else{

    const id = snapshot.docs[0].ref.id
    db.collection('/publicaciones').doc(id).update({
      descripcio
    });


    res.send("Publicacion eliminada");

  }

   

   

});

router.post('/bajar_comentarios/publicacion', async (req, res) => {
  const { descripcio, nombre } = req.body
  //console.log(req.body);
  console.log("funcion iniciada: bajar_comentarios/publicacion");


  const docRef = db.collection('comentaris_publicacion');
 const snapshot = await docRef.where('nombre', '==', nombre).where('descripcio', '==', descripcio).get();

  //const snapshot = await docRef.where('usuario.nombre', '==', nombre).get();
  if (snapshot.empty) {
      console.log('No se encontro la publicacion.');
      return;
  } 

  else{


        
    const docsData = snapshot.docs.map(doc => {
      const { comentaris } = doc.data(); // Obtén solo el campo "comentario"
      if (comentaris) {
        const { fecha_publicacion, usuario, texto, num_serie,  likes, respuestas} = comentaris; // Extrae "nombre" y "texto"
        return { fecha_publicacion, usuario, texto, num_serie,  likes, respuestas}; // Devuelve solo estos campos
      }});
    //console.log(docsData);
    res.send(docsData);


  }

   

   

});


router.post('/bajar_publicacion_usuario', async (req, res) => {
  const { nombre } = req.body
  //console.log(req.body);
  console.log("funcion iniciada: bajar_publicacion_usuario");

  
  const docRef = db.collection('publicaciones');
 // const snapshot = await docRef.where('descripcio', '==', descripcio).get();

  const snapshot = await docRef.where('usuario.nombre', '==', nombre).get();
  if (snapshot.empty) {
      console.log('No se encontro la publicacion.');
      return;
  } 

  else{


      const docsData = snapshot.docs.map(doc => doc.data());
  

      res.send(docsData)

  }

   

   

});




router.post('/bajar_mapa', async (req, res) => {
  const { comunidad } = req.body
  console.log("funcion iniciada: bajar_mapa");

  const docRef = db.collection('maps');
  const snapshot = await docRef.where('comunidad', '==', comunidad).get();
  if (snapshot.empty) {
      console.log('No se encontro ningun maps');
      return;
  } 
  else{

      //per enviar llistat aquesta

      const docsData = snapshot.docs.map(doc => doc.data());
      //const doc = snapshot.docs;

      //mirar bé apartir de aquí

      //const data = doc[0].data();

      //console.log("la data es:",data)

      res.send(docsData)

  }

  

});

router.post('/bajar_comunidad', async (req, res) => {
  console.log("funcion iniciada: bajar_comunidad");

   //const { nombre } = req.body
 // console.log('nombre:',nombre);
  const docRef = db.collection('comunidades');
  const snapshot = await docRef.get();
  //const snapshot = await docRef.where('nombre', '==', nombre).get();
  if (snapshot.empty) {
      console.log('No se encontro ninguna comunidad.');
      return;
  } 

  else{



      const docsData = snapshot.docs.map(doc => doc.data());
    // console.log("los mapas encontrados son:",docsData)


      res.send(docsData)

  }

   


});




router.post('/modificar_comunidad', async (req, res) => {

  const { creador } = req.body
// console.log('nombre:',nombre);
console.log("funcion iniciada: modificar_comunidad");

//console.log(req.body);

 const docRef = db.collection('comunidades');
 const snapshot = await docRef.where("creador","==", creador).get();
 //const snapshot = await docRef.where('nombre', '==', nombre).get();
 if (snapshot.empty) {
     console.log('No se encontro ninguna comunidad.');
     return;
 } 

 else{



     const docsData = snapshot.docs.map(doc => doc.data());


     res.send(docsData)

 }

  


});






router.post('/modificar_likes', async (req, res) => {

  const { nombre, fecha_publicacion, likes, nombre_iniciado, categoria, descripcio} = req.body


  const num_likes = JSON.parse(likes);

 //console.log(num_likes);
  console.log("funcion iniciada: modificar_likes");

//console.log('nombre:',nombre);
  const docRef = db.collection('publicaciones');
  const snapshot = await docRef.where('usuario.nombre', '==', nombre).where('fecha_publicacion', '==', fecha_publicacion).get();
  if (snapshot.empty) {
      console.log('No se encontro la publicacion .');
      return;
  } 

  else{

    const doc = snapshot.docs[0];
    const publicacion = snapshot.docs[0].data();

    //mirar bé apartir de aquí
    const id = doc.ref.id; 

 //console.log("la url del tema es:",id)


    await db.collection('/publicaciones').doc(id).update({
     num_likes
  })
  descripcio
 // 
 const docRef_2 = db.collection('publicacion_likeada');
 const snapshot2 = await docRef_2.where('nombre', '==', nombre).where('fecha_publicacion', '==',fecha_publicacion).where('descripcio', '==',descripcio).get();

 if (!snapshot2.empty) {


  const doc = snapshot2.docs[0];
  //const publicacion = snapshot2.docs[0].data();

  //mirar bé apartir de aquí

  const id = doc.ref.id; 

//console.log("la url del tema es:",id)
const num_likeados = num_likes.length;


await db.collection('/publicacion_likeada').doc(id).update({
    num_likeados
})


} else{

  const num_likeados = num_likes.length;
  

  
  await db.collection('/publicacion_likeada').add({
    num_likeados, 
    categoria,
    fecha_publicacion,
    descripcio ,
    nombre
 })
}


  const docRef_3 = db.collection('usuario');
  const usuario_token = await docRef_3.where('nombre', '==', nombre).get();
  

  const snapshot4 = await db.collection('publicacion_likeada').where('nombre', '==', nombre).get();

  const docsData = snapshot4.docs.map(doc => {
    // Obtenemos los datos del documento
    const { num_likeados, categoria, fecha_publicacion } = doc.data();
    
    // Devolvemos solo los campos necesarios
    return { num_likeados, categoria, fecha_publicacion };
  });


  const publicaciones = docsData;


  const id_usuario = usuario_token.docs[0].ref.id; 

  await db.collection('/usuario').doc(id_usuario).update({
    publicaciones
 })


  const token = usuario_token.docs[0].data().token;

  const doc_usuario = usuario_token.docs[0];
   

  //mirar bé apartir de aquí


  //const snapshot_nueva_publi = await docRef_3.where('usuario.nombre', '==', nombre).get();



  //const publicaciones = snapshot_nueva_publi.docs[0].data().publicaciones;

 const titulo = "Has recibido un like"
 const texto = "El usuario:,"+nombre_iniciado+" te ha dado un me gusta en tu publicación"
  enviarNotificacion(token,titulo,texto)


  

  const usuario_likeado = await docRef_3.where('nombre', '==', nombre).get();
  const nombre_usuario_likeado = usuario_likeado.docs[0].data().nombre;
  const foto_perfil_usuario_likeado= usuario_likeado.docs[0].data().foto_perfil;

  const usuario = {
    nombre:nombre_usuario_likeado,
    foto_perfil:foto_perfil_usuario_likeado
  }
  const now = admin.firestore.Timestamp.now();

  const expires_at = admin.firestore.Timestamp.fromMillis(now.toMillis() + 6 * 24 * 60 * 60 * 1000);
  await db.collection('/Notificaciones').add({
   usuario,
   titulo,
   texto,
   publicacion,
   expires_at

 })

}

});
  


  router.post('/modificar_likes/comentario_publi', async (req, res) => {

    const { comentaris, usuario_iniciado, descripcio, publicacion} = req.body
   
    console.log(descripcio);

  
  
    // console.log(comentarios);
    console.log("funcion iniciada: modificar_likes/comentario_publi");
  
  //  console.log('nombre:',nombre);
    const docRef = db.collection('comentaris_publicacion');
    const snapshot = await docRef.where('comentaris.texto', '==', comentaris.texto).where('comentaris.num_serie', '==', comentaris.num_serie).where('descripcio', '==', descripcio).get();
    if (snapshot.empty) {
        console.log('No se encontro la publicacion .');
        return;
    } 
  
    else{
  
      const doc = snapshot.docs[0];
     
  
      //mirar bé apartir de aquí
  
      const id = doc.ref.id; 
  
   //   console.log("la url del tema es:",id)
  
  
   //const comentaris = publicacion.comentaris
      await db.collection('/comentaris_publicacion').doc(id).update({
        comentaris
    });
  
    const docRef_3 = db.collection('usuario');
    const usuario_token = await docRef_3.where('nombre', '==', comentaris.usuario.nombre).get();
  
    const token = usuario_token.docs[0].data().token;
  
   const titulo = "Has recibido un like"
   const texto = "El usuario:,"+usuario_iniciado.nombre+" te ha dado un me gusta, en uno de tus comentarios"
    enviarNotificacion(token,titulo,texto)
  
  
    
  
    const usuario_likeado = await docRef_3.where('nombre', '==', comentaris.usuario.nombre).get();
    const nombre_iniciado_usuario_likeado = usuario_likeado.docs[0].data().nombre;
    const foto_perfil_usuario_likeado= usuario_likeado.docs[0].data().foto_perfil;
  
    const usuario = {
      nombre:nombre_iniciado_usuario_likeado,
      foto_perfil:foto_perfil_usuario_likeado
    }
    const now = admin.firestore.Timestamp.now();

const expires_at = admin.firestore.Timestamp.fromMillis(now.toMillis() + 6 * 24 * 60 * 60 * 1000);

    await db.collection('/Notificaciones').add({
     usuario,
     titulo,
     texto,
     expires_at
  
   })



  }

   


});


router.post('/bajar_usuario2', async (req, res) => {

  const { nombre } = req.body


  console.log("funcion iniciada: bajar_usuario_2");

//  console.log('nombre:',nombre);
  const docRef = db.collection('usuario');
  const snapshot = await docRef.where('nombre', '==', nombre).get();
  if (snapshot.empty) {
      console.log('No se encontro el usuario.');
      return;
  } 

  else{



      //const docsData = snapshot.docs.map(doc => doc.data());


      //res.send(docsData)

      const doc = snapshot.docs;

      //mirar bé apartir de aquí

      const data = doc[0].data();

    //  console.log("la data del tema es:",data)

      res.send(data)


  }

   


});

router.post('/bajar_ranking_usuario', async (req, res) => {

  const { email } = req.body


  console.log("funcion iniciada: bajar_ranking_usuario");

 //  console.log("email:",email);
//  console.log('nombre:',nombre);
  const docRef = db.collection('usuario');
  const snapshot = await docRef.get();
  if (snapshot.empty) {
      console.log('No se encontro el usuario.');
      return;
  } 

  else{



      const docsData = snapshot.docs.map(doc => doc.data());


    res.send(docsData)



  }

   


});



router.post('/bajar_buscador_usuario', async (req, res) => {

  const { nombre } = req.body

  console.log(nombre);

  console.log("funcion iniciada: bajar_buscador_usuario");

 //  console.log("email:",email);
//  console.log('nombre:',nombre);
  const docRef = db.collection('usuario');
  //const snapshot = await docRef.where('nombre', '==', nombre).get();

  const snapshot = await docRef
  .orderBy('nombre') // Es necesario tener un índice en Firestore para 'orderBy'
  .startAt(nombre) // Comienza con la cadena que quieres buscar
  .endAt(nombre + '\uf8ff') // Asegura que incluyas todos los resultados que empiecen con esa cadena
  .get();
  if (snapshot.empty) {
      console.log('No se encontro el usuario.');
      return;
  } 

  else{



      const docsData = snapshot.docs.map(doc => doc.data());


    res.send(docsData)



  }

   


});




router.post('/bajar_buscador_comunidad', async (req, res) => {

  const { nombre } = req.body

  console.log(nombre);

  console.log("funcion iniciada: bajar_buscador_comunidad");


  const docRef = db.collection('comunidades');


  const snapshot = await docRef
  .orderBy('nombre') // Es necesario tener un índice en Firestore para 'orderBy'
  .startAt(nombre) // Comienza con la cadena que quieres buscar
  .endAt(nombre + '\uf8ff') // Asegura que incluyas todos los resultados que empiecen con esa cadena
  .get();
  if (snapshot.empty) {
      console.log('No se encontro el usuario.');
      return;
  } 

  else{



      const docsData = snapshot.docs.map(doc => doc.data());


    res.send(docsData)



  }

   


});

router.post('/bajar_usuario', async (req, res) => {

  const { email } = req.body

 // console.log("email:",email);

  console.log("funcion iniciada: bajar_usuario");

 //  console.log("email:",email);
//  console.log('nombre:',nombre);
  const docRef = db.collection('usuario');
  const snapshot = await docRef.where('email', '==', email).get();
  if (snapshot.empty) {
      console.log('No se encontro el usuario.');
      return;
  } 

  else{



      //const docsData = snapshot.docs.map(doc => doc.data());


      //res.send(docsData)

      const doc = snapshot.docs;

      //mirar bé apartir de aquí

      const data = doc[0].data();

    //  console.log("la data del tema es:",data)

   // console.log(data);

      res.send(data)


  }

   


});


router.post('/bajar_history', async (req, res) => {

  const { email } = req.body



  const docRef2 = db.collection('history');

  const now = admin.firestore.Timestamp.now();

  var contador = 0;

  const snapshot_history = await docRef2.where('expira_en', '<', now).get();

  const url_publicacion = ["hola"];
  const docsData = snapshot_history.docs.map(doc => {
    const id = doc.ref.id
    const { filename } = doc.data(); // Obtén el array de filenames
    if (Array.isArray(filename)) {

      
      filename.forEach(file => {
        bucket.file(file).delete();
      });
    }



     db.collection('/history').doc(id).delete();

  });




  console.log("funcion iniciada: bajar_history");
  // Calcula la marca de tiempo de hace un día
   //const haceUnDia = new Date();
   //haceUnDia.setDate(haceUnDia.getDate() - 1);
  // Consulta para obtener los documentos con un fecha_creacion anterior a hace un día
   //const snapshot_delete = await docRef.where("fecha_creacion", "<", haceUnDia).get();

   // Elimina cada documento
       // Elimina cada documento
       // const batch = db.batch(); // Usamos un batch para eficiencia
       // snapshot_delete.docs.forEach((doc) => {
       //   batch.delete(doc.ref);
       //});

  const snapshot = await docRef2.get();
  if (snapshot.empty) {
      console.log('No se encontro la history.');
      return;
  } 

  else{

    const docsData = snapshot.docs.map(doc => doc.data());
  

    res.send(docsData)



  }

   


});



router.post('/subir_visto/history', async (req, res) => {

  const { nuevo_visto, fecha_publicacion, nombre } = req.body

  const visto = JSON.parse(nuevo_visto);

  console.log("funcion iniciada: subir_visto/history");

  const docRef = db.collection('history');
  const snapshot = await docRef.where('fecha_publicacion', '==', fecha_publicacion).where('usuario.nombre', '==', nombre).get();
  if (snapshot.empty) {
      console.log('-----------No se encontro la history---------');
      return;
  } 

  else{

    const doc = snapshot.docs[0];
   


    

    const id = doc.ref.id; 

 


    await db.collection('/history').doc(id).update({
     
      visto
  });



  }

   


});



router.post('/eliminar_notificaciones', async (req, res) => {

  const { nombre, texto } = req.body

// console.log("nombre:",nombre);

  console.log("funcion iniciada: eliminar_notificaciones");

 //  console.log("email:",email);
//  console.log('nombre:',nombre);
  const docRef = db.collection('Notificaciones');
  const snapshot = await docRef.where('usuario.nombre', '==', nombre).where('texto', '==', texto).get();
  if (snapshot.empty) {
      console.log('No se encontro el usuario.');
      return;
  } 

  else{


    const doc = snapshot.docs[0];
 

    const id = doc.ref.id; 




    await db.collection('/Notificaciones').doc(id).delete();


   


  }

   


});


router.post('/bajar_notificaciones', async (req, res) => {

  const { nombre } = req.body

// console.log("nombre:",nombre);

  console.log("funcion iniciada: bajar_notificaciones");

 //  console.log("email:",email);
//  console.log('nombre:',nombre);
  const docRef = db.collection('Notificaciones');
  const snapshot = await docRef.where('usuario.nombre', '==', nombre).get();
  if (snapshot.empty) {
      console.log('No se encontro el usuario.');
      return;
  } 

  else{



      //const docsData = snapshot.docs.map(doc => doc.data());


      //res.send(docsData)

      const doc = snapshot.docs;

      //mirar bé apartir de aquí

     
  
      const docsData = snapshot.docs.map(doc => doc.data());
     // console.log(docsData);

      res.send(docsData)

    //  console.log("la data del tema es:",data)

   


  }

   


});
router.post('/bajar_comentarios', async (req, res) => {

  const { titulo, comunidad} = req.body

  console.log("titulo:",titulo);
  console.log("comunidad:",comunidad);
  //console.log('titulo:',titulo);
  console.log("funcion iniciada: bajar_comentarios");

  const docRef = db.collection('tema_foro');
  const snapshot = await docRef.where('titulo', '==', titulo).where('comunidad', '==', comunidad).get();
  if (snapshot.empty) {
      console.log('No se encontro el tema.');
      return;
  } 

  else{



      //const docsData = snapshot.docs.map(doc => doc.data());


      //res.send(docsData)

      const doc = snapshot.docs;

      //mirar bé apartir de aquí

      const data = doc[0].data();

   //  console.log("la data del tema es:",data)

      res.send(data)


  }

   


});

router.post('/bajar_comentarios_nuevo', async (req, res) => {

  const { titulo, comunidad} = req.body

  console.log("titulo:",titulo);
  console.log("comunidad:",comunidad);
  //console.log('titulo:',titulo);
  console.log("funcion iniciada: bajar_comentarios_nuevo");

  const docRef = db.collection('tema_foro');
  const snapshot = await docRef.where('titulo', '==', titulo).where('comunidad', '==', comunidad).get();
  if (snapshot.empty) {
      console.log('No se encontro el tema.');
      return;
  } 

  else{

  
 //   const docsData = snapshot.docs.map(doc => 
   //   {
    //  const { comentarios } = doc.data();
    //  return { comentarios }; // Devuelve solo el campo comentario
  //  });
    
    const docsData = snapshot.docs.map(doc => {
      const { comentarios } = doc.data(); // Obtén solo el campo "comentario"
      if (comentarios) {
        const { fecha_publicacion, usuario, texto, num_serie,  likes, respuestas} = comentarios; // Extrae "nombre" y "texto"
        return { fecha_publicacion, usuario, texto, num_serie,  likes, respuestas}; // Devuelve solo estos campos
      }});
    console.log(docsData);
    res.send(docsData);

  }

   


});


router.post('/subir_token', async (req, res) => {

  const { token, email } = req.body


  console.log("funcion iniciada: subir_token");

//  console.log('nombre:',nombre);
  const docRef = db.collection('usuario');
  const snapshot = await docRef.where('email', '==', email).get();
  if (snapshot.empty) {
      console.log('No se encontro el usuario.');
      return;
  } 

  else{


    const doc = snapshot.docs[0];
 

    const id = doc.ref.id; 




    await db.collection('/usuario').doc(id).update({
      token
  })

  }

   


});



router.post('/subir_sugerencia', async (req, res) => {

  const { nombre, sugerencia } = req.body


  console.log("funcion iniciada: subir_sugerencia");

  const docRef = db.collection('Sugerencias');
  const snapshot = await docRef.where('nombre', '==', nombre).where('sugerencia', '==', sugerencia).get();
  if (snapshot.empty) {
    await db.collection('/Sugerencias').add({
      nombre,
      sugerencia
  })
  res.send("sugerencia enviada");

    return;
} 



});


router.post('/buscador_usuario', async (req, res) => {

  const { nombre } = req.body


  
  console.log("funcion iniciada: buscador_usuario");

//  console.log('nombre:',nombre);
const docRef = db.collection('usuario');
const snapshot = await docRef.where('nombre', '>=', nombre).where('nombre', '<=', nombre + '\uf8ff').get();

  if (snapshot.empty) {
      console.log('No se encontro el usuario.');
      return;
  } 

  else{



      //const docsData = snapshot.docs.map(doc => doc.data());


      //res.send(docsData)

      const doc = snapshot.docs;

      //mirar bé apartir de aquí

      const data = doc[0].data();

      const docsData = snapshot.docs.map(doc => doc.data());
      
      console.log(docsData);

      
      res.send(docsData);


    //  console.log("la data del tema es:",data)



  }

   


});




router.post('/modificar_likes/coment_foro', async (req, res) => {

  //console.log(req)

  const { titulo, comunidad, usuario_iniciado, usuario_likeado, num_serie, comentarios} = req.body
  //console.log('titulo:',titulo);
// console.log('comentarios:',comentarios);
  const docRef = db.collection('tema_foro');

  console.log("funcion iniciada: modificar_likes/coment_foro");

  const snapshot = await docRef.where('titulo', '==', titulo).where('num_serie', '==', num_serie).where('comunidad', '==', comunidad).get();
  if (snapshot.empty) {
      console.log('No se encontro el tema.');
      return;
  } 

  else{


      //const docsData = snapshot.docs.map(doc => doc.data());


      //res.send(docsData)

      const doc = snapshot.docs[0];
   


      //mirar bé apartir de aquí

      const id = doc.ref.id; 

   //   console.log("la url del tema es:",id)


      await db.collection('/tema_foro').doc(id).update({
        comentarios
    })


  }

   
  const tema_foro = snapshot.docs[0].data();

  const docRef_3 = db.collection('usuario');
  const usuario_token = await docRef_3.where('nombre', '==', usuario_likeado.nombre).get();

  const token = usuario_token.docs[0].data().token;

 const titulo1 = "Has recibido un like"

 const texto = "El usuario:,"+usuario_iniciado.nombre+" te ha dado un me gusta, en uno de tus comentarios, en el tema del foro:"+titulo+"de la comunidad:"+comunidad+
 "en el comentario num serie:"+num_serie
  enviarNotificacion(token,titulo1,texto)


  

  const usuario_inciado = await docRef_3.where('nombre', '==', usuario_iniciado.nombre).get();
  const nombre_iniciado_nuevo = usuario_inciado.docs[0].data().nombre;
  const foto_perfil_iniciado= usuario_inciado.docs[0].data().foto_perfil;

  const usuario = {
    nombre:nombre_iniciado_nuevo,
    foto_perfil:foto_perfil_iniciado
  }
  const now = admin.firestore.Timestamp.now();

  const expires_at = admin.firestore.Timestamp.fromMillis(now.toMillis() + 6 * 24 * 60 * 60 * 1000);
  await db.collection('/Notificaciones').add({
   usuario,
   titulo1,
   texto,
   tema_foro,
   expires_at
 })



});
   
router.post('/subir_comentario', async (req, res) => {

  //console.log(req)

  const { titulo, comentarios, comunidad, creador} = req.body
  const num_serie=comentarios.num_serie
  console.log(creador);
  //console.log('titulo:',titulo);
// console.log('comentarios:',comentarios);
const docRef = db.collection('tema_foro');

console.log("funcion iniciada: subir_comentario");

const snapshot = await docRef.where('titulo', '==', titulo).where('comentarios.texto', '==', comentarios.texto).where('comunidad', '==', comunidad).get();

if(snapshot.empty) {

      await db.collection('/tema_foro').add({
       
        titulo,
        comentarios,
        comunidad,
        creador,
        num_serie
    })


  }
}

);

router.post('/subir_comentarios', async (req, res) => {

  //console.log(req)

  const { titulo, comentarios, comunidad, creador, texto} = req.body
  //console.log(creador);
  //console.log('titulo:',titulo);
// console.log('comentarios:',comentarios);
  const docRef = db.collection('tema_foro');

  console.log("funcion iniciada: subir_comentarios");

  const snapshot = await docRef.where('titulo', '==', titulo).where('comentarios.texto', '==', texto).where('comunidad', '==', comunidad).get();
  if (snapshot.empty) {
      console.log('No se encontro el comentario.');
      return;
  } 

  else{


      //const docsData = snapshot.docs.map(doc => doc.data());


      //res.send(docsData)

      const doc = snapshot.docs[0];
   

      //mirar bé apartir de aquí

      const id = doc.ref.id; 

   //   console.log("la url del tema es:",id)


      await db.collection('/tema_foro').doc(id).update({
       
        comentarios
    })


  }

});
   

router.post('/subir_comentarios_publicacion/respuesta', async (req, res) => {

  

  const {  comentaris ,descripcio, nombre} = req.body


  console.log(comentaris);
  console.log("funcion iniciada: subir_comentarios_publicacion/respuesta");

 // console.log(comentaris);
  const docRef = db.collection('comentaris_publicacion');

 



 const snapshot = await docRef.where('nombre', '==', nombre).where('descripcio', '==', descripcio).where('comentaris.texto', '==', comentaris.texto).where('comentaris.num_serie', '==', comentaris.num_serie).get();
 if (snapshot.empty) {
     console.log('No se encontro el comentario.');
     return;
 } 

 else{


     //const docsData = snapshot.docs.map(doc => doc.data());


     //res.send(docsData)

     const doc = snapshot.docs[0];
  

     //mirar bé apartir de aquí

     const id = doc.ref.id; 

  //   console.log("la url del tema es:",id)


     await db.collection('/comentaris_publicacion').doc(id).update({
      comentaris
   })


  


}
}
);



router.post('/subir_comentarios', async (req, res) => {

  //console.log(req)

  const { titulo, comentarios, comunidad, creador, texto} = req.body
  //console.log(creador);
  //console.log('titulo:',titulo);
// console.log('comentarios:',comentarios);
  const docRef = db.collection('tema_foro');

  console.log("funcion iniciada: subir_comentarios");

  const snapshot = await docRef.where('titulo', '==', titulo).where('comentarios.texto', '==', texto).where('comunidad', '==', comunidad).get();
  if (snapshot.empty) {
      console.log('No se encontro el comentario.');
      return;
  } 

  else{


      //const docsData = snapshot.docs.map(doc => doc.data());


      //res.send(docsData)

      const doc = snapshot.docs[0];
   

      //mirar bé apartir de aquí

      const id = doc.ref.id; 

   //   console.log("la url del tema es:",id)


      await db.collection('/tema_foro').doc(id).update({
       
        comentarios
    })


  }

});
   

router.post('/subir_comentarios_publicacion', async (req, res) => {

  

  const {  comentaris ,descripcio, fecha_publicacion, num_serie, nombre, url_publicacion, num_coment} = req.body

  console.log("funcion iniciada: subir_comentarios_publicacion");


 // console.log(comentaris);
 const docRef = db.collection('comentaris_publicacion');

 
//console.log("url_publicacion:",url_publicacion);


 const snapshot = await docRef.where('nombre', '==', nombre).where('descripcio', '==', descripcio).where('comentaris.texto', '==', comentaris.texto).where('comentaris.num_serie', '==', comentaris.num_serie).get();
 if (snapshot.empty) {

     await db.collection('/comentaris_publicacion').add({
      comentaris,
      fecha_publicacion,
      descripcio,
      num_serie,
      nombre
  })
    
  const docRef2 = db.collection('publicaciones');


     const snapshot2 = await docRef2.where('url_publicacion', '==', url_publicacion).where('usuario.nombre', '==', nombre).get();
     if (snapshot2.empty) {
         console.log('No se encontro la publicacion.');
         return;
     } 
   
     else{
   
   
         const doc = snapshot2.docs[0];
      
   
         //mirar bé apartir de aquí
   
         const id = doc.ref.id; 
   
      //   console.log("la url del tema es:",id)
   
   
         await db.collection('/publicaciones').doc(id).update({
          
          num_coment
       })
      }   

      return;
  
 } 

 



   


  


});

router.post('/temas', async (req, res) => {
  const {  comunidad } = req.body
  //console.log('descripcio:',descripcio);
      ///  console.log(req.body);
      console.log("funcion iniciada: temas");

  const docRef = db.collection('temas');
const snapshot = await docRef.where('comunidad', '==' , comunidad).get();
  if (snapshot.empty) {
      console.log('No se encontro ningun tema.');
      return;
  } 

  else{

      const docsData = snapshot.docs.map(doc => doc.data());
   
    //  console.log("la data es:",docsData)

      res.send(docsData)

  }

});

router.post('/new-contact', async (req, res) => {
    try {
        const { nombre, email } = req.body;
        


        console.log("funcion iniciada: new-contact");

    
        const nombre_base_de_datos = await db.collection('usuario').where('nombre', '==', nombre).get();
        //const telefono_base_de_datos = await db.collection('usuarios').where('telefono', '==', telefono).get();
        const email_base_de_datos = await db.collection('usuario').where('email', '==', email).get();
        console.log(nombre_base_de_datos);
        //console.log(telefono_base_de_datos);
        console.log(email_base_de_datos);
        if(!nombre_base_de_datos.empty){
            res.send('El nombre ya existe');
        }
       // else if (!telefono_base_de_datos.empty){
       //     res.send('El telefono ya existe');
        //}
        else if (!email_base_de_datos.empty){
            res.send('El email ya existe');
        }
        else {
            await db.collection('usuario').add({
                nombre,
               // apellido,
    
                //telefono,
                email
            })

            console.log(nombre_base_de_datos);
            res.send('Usuario creado');
          
            console.log('Usuario creado');
        }
        
        
       
       
    } catch (error) {
        console.error('Error creando usuario:', error);
        res.status(500).send('Error creando usuario');
    }
});


router.post('/buscar_mensajes_privados', async (req, res) => {
  try {
    

    const { usuario_1, usuario_2} = req.body;
   //console.log(usuario_1);
    console.log("funcion iniciada:buscar_mensajes_privados ");



      const docRef = db.collection('mensaje_final');
      const snapshot_usuario_1 = await docRef.where('usuario_1.nombre','==', usuario_1).get();

      const snapshot_usuario_2 = await docRef.where('usuario_2.nombre','==', usuario_2).get();





 const data = snapshot_usuario_1.docs.map(doc => doc.data());

 
 const data_2 = snapshot_usuario_2.docs.map(doc => {
  if (doc.data().usuario_1.nombre != doc.data().usuario_2.nombre) {
    return doc.data();
  }
  return null; // Retorna null para los elementos que no cumplen la condición
}).filter(doc => doc !== null); // Filtra los nulls para que el array final solo tenga los elementos válidos


 

 // console.log(data);
 // console.log(data_2);

// Combinar resultados
const resultados = [...data, ...data_2];
 // console.log(resultados);
// Enviar resultados combinados
res.send(resultados);

   
      

   //res.send(docsData)

   //const doc = snapshot_usuario.docs[0];
  // const doc2 = snapshot_usuario_2.docs[0];
   //const data  = doc.data();
  // const data = doc.data();
   //const data_2 = doc2.data();
   //const foto_perfil = data.foto_perfil;

   //const usuario = {nombre, foto_perfil}
   

   
      
     //  const docsData = snapshot.docs.map(doc => {
        // const data = doc.data();
        // return {
         //    usuario_1:{...data},           // Copia todos los datos originales del documento
       //      usuario_2: usuario  // Agrega la constante 'usuario'
      //  };
    // });



  //    const docRef2 = db.collection('publicaciones');

 
    //  const snapshot2 = await docRef2.where('nombre', '==', nombre).get();

    //  if (snapshot2.empty) {
     //   res.send(docsData);

     // }
     // else{
     //   const docsData2 = snapshot2.docs.map(doc => doc.data());
     //   res.send(docsData);


     // }
         
    
     
  } catch (error) {
      console.error('Error buscando mensajes:', error);
      res.status(500).send('Error buscando mensajes');
  }
});





router.post('/add_seguidor_nuevo', async (req, res) => {
  try {
    

    const { nombre_iniciado, nombre_2,seguidores_nueva,seguidos_nueva} = req.body;
   //console.log(usuario_1);
    console.log("funcion iniciada:add_seguidor_nuevo ");
  
    const seguidores = JSON.parse(seguidores_nueva);
    
    const seguidos = JSON.parse(seguidos_nueva);

      const docRef = db.collection('usuario');
      const snapshot_usuario_1 = await docRef.where('nombre','==', nombre_iniciado).get();

      const snapshot_usuario_2 = await docRef.where('nombre','==', nombre_2).get();



 //const data = snapshot_usuario_1.docs.map(doc => doc.data());
  //const data_2 = snapshot_usuario_2.docs.map(doc => doc.data());
  

  console.log("snapshot_1:",snapshot_usuario_1);
  console.log("snapshot_2:",snapshot_usuario_2);
 

  




if(!snapshot_usuario_1.empty){
  const doc = snapshot_usuario_1.docs[0];

  const id = doc.ref.id; 
 



      await db.collection('/usuario').doc(id).update({
        seguidos
    });

    const docRef_3 = db.collection('usuario');

    const usuario_token = await docRef_3.where('nombre', '==', nombre_2).get();

    const token = usuario_token.docs[0].data().token;
  
   const titulo = "Has recibido un seguimiento"
   const texto = "El usuario:,"+nombre_iniciado+" te ha empezado a seguir"
    enviarNotificacion(token,titulo,texto)
  
  
    
  
    const usuario_likeado = await docRef_3.where('nombre', '==', nombre_iniciado).get();
    const nombre_usuario_likeado = usuario_likeado.docs[0].data().nombre;
    const foto_perfil_usuario_likeado= usuario_likeado.docs[0].data().foto_perfil;
  
    const usuario = {
      nombre:nombre_usuario_likeado,
      foto_perfil:foto_perfil_usuario_likeado
    }
    const now = admin.firestore.Timestamp.now();

    const expires_at = admin.firestore.Timestamp.fromMillis(now.toMillis() + 6 * 24 * 60 * 60 * 1000);
    await db.collection('/Notificaciones').add({
     usuario,
     titulo,
     texto,
     expires_at
  
   }) 
}

if(!snapshot_usuario_2.empty){
  const doc2 = snapshot_usuario_2.docs[0];

  //mirar bé apartir de aquísnapshot_usuario_1
  const id = doc2.ref.id; 
 



  await db.collection('/usuario').doc(id).update({
    seguidores
});
 

const docRef_3 = db.collection('usuario');

const usuario_token = await docRef_3.where('nombre', '==', nombre_2).get();

const token = usuario_token.docs[0].data().token;

const titulo = "Has recibido un seguimiento"
const texto = "El usuario:,"+nombre_iniciado+" te ha empezado a seguir"
enviarNotificacion(token,titulo,texto)




const usuario_likeado = await docRef_3.where('nombre', '==', nombre_iniciado).get();
const nombre_usuario_likeado = usuario_likeado.docs[0].data().nombre;
const foto_perfil_usuario_likeado= usuario_likeado.docs[0].data().foto_perfil;

const usuario = {
  nombre:nombre_usuario_likeado,
  foto_perfil:foto_perfil_usuario_likeado
}
const now = admin.firestore.Timestamp.now();

const expires_at = admin.firestore.Timestamp.fromMillis(now.toMillis() + 6 * 24 * 60 * 60 * 1000);
await db.collection('/Notificaciones').add({
 usuario,
 titulo,
 texto,
 expires_at

}) 


}
     
  } catch (error) {
      console.error('Error buscando mensajes:', error);
      res.status(500).send('Error buscando mensajes');
  }
});
router.post('/buscar_mensajes_privados_visitado', async (req, res) => {
  try {
    

    const { usuario_1, usuario_2} = req.body;
   //console.log(usuario_1);
    console.log("funcion iniciada:buscar_mensajes_privados_visitado ");
    console.log("usuario_2:",usuario_2);
    console.log("usuario_1:",usuario_1);
      
      const docRef = db.collection('mensajes_privados');
      const snapshot_usuario_1 = await docRef.where('usuario_1.nombre','==', usuario_1).where('usuario_2.nombre','==', usuario_2).get();

      const snapshot_usuario_2 = await docRef.where('usuario_2.nombre','==', usuario_1).where('usuario_1.nombre','==', usuario_2).get();



 //const data = snapshot_usuario_1.docs.map(doc => doc.data());
  //const data_2 = snapshot_usuario_2.docs.map(doc => doc.data());
  

  console.log("snapshot_1:",snapshot_usuario_1);
  console.log("snapshot_2:",snapshot_usuario_2);

if(!snapshot_usuario_1.empty){
  const doc = snapshot_usuario_1.docs;


  const data_enviar = doc[0].data();
  console.log("data_enviar:",data_enviar);

  res.send(data_enviar);
  return;
}

if(!snapshot_usuario_2.empty){
  const doc2 = snapshot_usuario_2.docs;

  //mirar bé apartir de aquísnapshot_usuario_1

  const data_enviar_2 = doc2[0].data();
  console.log("data_enviar2:",data_enviar_2);

 res.send(data_enviar_2);
 return;
 
}


  
     
  } catch (error) {
      console.error('Error buscando mensajes:', error);
      res.status(500).send('Error buscando mensajes');
  }
});






router.post('/bajar_chat_usuarios', async (req, res) => {
  try {
    

    const { usuario_1, usuario_2} = req.body;
   //console.log(usuario_1);
    console.log("funcion iniciada:buscar_mensajes_privados ");

  
      
      const docRef = db.collection('mensajes_privados');
      const snapshot_usuario_1 = await docRef.where('usuario_1.nombre','==', usuario_1.nombre).where('usuario_2.nombre','==', usuario_2.nombre).get();

      const snapshot_usuario_2 = await docRef.where('usuario_1.nombre','==', usuario_2.nombre).where('usuario_2.nombre','==', usuario_1.nombre).get();





 const data = snapshot_usuario_1.docs.map(doc => doc.data());
  const data_2 = snapshot_usuario_2.docs.map(doc => doc.data());

const resultados = [...data, ...data_2];


res.send(resultados);

  
    
     
  } catch (error) {
      console.error('Error buscando mensajes:', error);
      res.status(500).send('Error buscando mensajes');
  }
});




router.post('/subir_chat_usuarios', async (req, res) => {
  try {
    
    const { usuario_1, usuario_2,mensaje} = req.body;
  
 //   console.log("Usuario_1:",usuario_1)
   // console.log("Usuario_2:",usuario_2)



   const docRef = db.collection('mensajes_privados');
   const snapshot = await docRef.where('mensaje.texto','==', mensaje.texto).where('mensaje.autor','==', mensaje.autor).where('mensaje.fecha_envio','==', mensaje.fecha_envio).get();
    //const docRef = db.collection('mensajes_privados');

    if(snapshot.empty){

      await db.collection('/mensajes_privados').add({
        usuario_1,
        usuario_2,
        mensaje
    })
      
   const docRef2 = db.collection('mensaje_final');
   const snapshot_usuario_1 = await docRef2.where('usuario_1.nombre','==', usuario_1.nombre).where('usuario_2.nombre','==', usuario_2.nombre).get();

   const snapshot_usuario_2 = await docRef2.where('usuario_1.nombre','==', usuario_2.nombre).where('usuario_2.nombre','==', usuario_1.nombre).get();


   if(snapshot_usuario_1.empty && snapshot_usuario_2.empty){

    const mensaje_final = mensaje.texto
    await db.collection('/mensaje_final').add({
      usuario_1,
      usuario_2,
      mensaje_final
  })

  return;
}
  else if(!snapshot_usuario_2.empty){
    const doc = snapshot_usuario_2.docs[0];

    const id = doc.ref.id; 
   
    const mensaje_final = mensaje.texto

  
  
        await db.collection('/mensaje_final').doc(id).update({
          mensaje_final
      });
      return;
  }

 else if(!snapshot_usuario_1.empty){
    const doc = snapshot_usuario_1.docs[0];

    const id = doc.ref.id; 
   
    const mensaje_final = mensaje.texto

  
  
        await db.collection('/mensaje_final').doc(id).update({
          mensaje_final
      });

      return;
  }

   }
  

  
    





    
    
     
  } catch (error) {
      console.error('Error subiendo mensajes:', error);
      res.status(500).send('Error subiendo mensajes');
  }
});

router.post('/new-contact_telefono', async (req, res) => {
  try {
      const { nombre, telefono } = req.body;
      
      console.log("funcion iniciada: new-contact_telefono "); // Verificar el cuerpo de la solicitud
      const nombre_base_de_datos = await db.collection('usuario').where('nombre', '==', nombre).get();
      const telefono_base_de_datos = await db.collection('usuario').where('telefono', '==', telefono).get();
      console.log(nombre_base_de_datos);
      console.log(telefono_base_de_datos);
      if(!nombre_base_de_datos.empty){
          res.send('El nombre ya existe');
      }
      else if (!telefono_base_de_datos.empty){
          res.send('El telefono ya existe');
      }
     
      else {
          await db.collection('usuario').add({
              nombre,
            
              telefono,
              email
          })

          console.log(nombre_base_de_datos);
          res.send('Usuario creado');
        
          console.log('Usuario creado');
      }
      
      
     
     
  } catch (error) {
      console.error('Error creando usuario:', error);
      res.status(500).send('Error creando usuario');
  }
});

router.post('/nueva_publicacion', async (req, res) => {
  try {
      
      console.log(req.body); // Verificar el cuerpo de la solicitud
      const publicacion = req.body

     
      await db.collection('publicaciones').add(publicacion)

      
      res.send('Publicacion subida correctamente');
        
      console.log('Publicacion subida');
      }
      
      
     
     
   catch (error) {
      console.error('Error subiendo publi:', error);
      res.status(500).send('Error subiendo publiacion');
  }
});
module.exports = router;
