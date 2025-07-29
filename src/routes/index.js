
const fs = require("fs");
const { format } = require('date-fns');
const app = require('./../app');
const express = require('express');


 //CHAT EN TIEMPO REAL
const { Server } = require('socket.io');
const https = require('https');

const app_2 = express();

const {subida} = require('../../multer');

const {generarPalabraAleatoria, generarNumeroAleatorio} = require('../randomWord');
const sharp = require('sharp');

const {Router} = require("express");
const {db, admin} = require('../firebase');
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/memebookinfo.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/memebookinfo.com/fullchain.pem'),
};

const server = https.createServer(options, app);
server.listen(443, () => {
  console.log('Servidor HTTPS corriendo en puerto 443');
});

//const server = http.createServer(app_2);
const io = new Server(server);

 //CHAT EN TIEMPO REAL
//const io = new Server(server, {
 // path: '/chat' // Ruta específica para Socket.IO
//});



// Namespace para el chat
const chatNamespace = io.of('/chat');





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


async function Recibir_codigo_chat(codigo_chat, usuario_1, usuario_2) {

  

  if (codigo_chat.trim() === 'para no estar contigo'){

 
  const docRef = db.collection('mensaje_final');
  const snapshot_usuario_1 = await docRef.where('usuario_1.nombre','==', usuario_1).where('usuario_2.nombre','==', usuario_2).get();

  const snapshot_usuario_2 = await docRef.where('usuario_2.nombre','==', usuario_2).where('usuario_2.nombre','==', usuario_1).get();



  if(!snapshot_usuario_1.empty){
    const codigo_chat = snapshot_usuario_1.docs[0].data().codigo_chat;
    return codigo_chat
  }
  if(!snapshot_usuario_2.empty){
    const codigo_chat = snapshot_usuario_2.docs[0].data().codigo_chat;
    return codigo_chat
  }
  if(snapshot_usuario_2.empty && snapshot_usuario_1.empty){
    return  generarPalabraAleatoria(generarNumeroAleatorio())+generarPalabraAleatoria(generarNumeroAleatorio())+generarPalabraAleatoria(generarNumeroAleatorio())

}
  }

else{ 
   
  if (codigo_chat.trim() === 'NUEVO CHAT'){
    return  generarPalabraAleatoria(generarNumeroAleatorio())+generarPalabraAleatoria(generarNumeroAleatorio())+generarPalabraAleatoria(generarNumeroAleatorio())

  }else{
    return codigo_chat
  }

}
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
 //CHAT EN TIEMPO REAL
chatNamespace.on('connection', async (socket) => {



  console.log('Un cliente se ha conectado al chat');

  socket.on('mensaje', async (data) => {

    const mensajeRecibido = JSON.parse(data);
    const nombre_sala_cliente = mensajeRecibido.usuario_1.nombre+"_"+mensajeRecibido.usuario_2.nombre
    socket.join(nombre_sala_cliente);
 
    console.log('Mensaje recibido en el chat: se ha enviat el misatge');
   // const { usuario_1, usuario_2,mensaje} = data;
  
    console.log("funcion iniciado: subir_chat_usuarios");
    // console.log("Usuario_2:",usuario_2)
 
 
 
    const docRef = db.collection('mensajes_privados');
    const snapshot = await docRef.where('mensaje.texto','==', mensajeRecibido.mensaje.texto).where('mensaje.autor','==', mensajeRecibido.mensaje.autor).where('mensaje.fecha_envio','==', mensajeRecibido.mensaje.fecha_envio).get();
    //const docRef = db.collection('mensajes_privados');
    const usuario_1= mensajeRecibido.usuario_1
    const usuario_2 = mensajeRecibido.usuario_2
    const mensaje = mensajeRecibido.mensaje
    const autor = mensajeRecibido.mensaje.autor
    const hora = admin.firestore.Timestamp.now();
    const codigo_chat = mensajeRecibido.codigo_chat

    const codigo = await Recibir_codigo_chat(codigo_chat,usuario_1.nombre,usuario_2.nombre)

    console.log("codigo chat en Socket:",codigo_chat)
    console.log("codigo chat en Socket nuevo:",codigo)
console.log("nombre 2:",usuario_2.nombre);

        const docUsers = db.collection('/usuario');

 const snapshot_usuario_1 = await docUsers.where('nombre','==', usuario_1.nombre).get();

  const snapshot_usuario_2 = await docUsers.where('nombre','==', usuario_2.nombre).get();



    if(autor != usuario_1.nombre){
    const  notificaciones = snapshot_usuario_1.docs[0].data().notificaciones;
 if(!notificaciones.includes("mensaje")){


    
    const doc = snapshot_usuario_1.docs[0];
   

    //mirar bé apartir de aquí

    const id = doc.ref.id; 

 //   console.log("la url del tema es:",id)


    await db.collection('/usuario').doc(id).update({
     
        notificaciones: admin.firestore.FieldValue.arrayUnion("mensaje")

  })

  }

    }
    if (autor != usuario_2.nombre) {
          const  notificaciones = snapshot_usuario_2.docs[0].data().notificaciones;
           if(!notificaciones.includes("mensaje")){



    const doc = snapshot_usuario_2.docs[0];
   

    //mirar bé apartir de aquí

    const id = doc.ref.id; 

 //   console.log("la url del tema es:",id)


    await db.collection('/usuario').doc(id).update({
     
        notificaciones: admin.firestore.FieldValue.arrayUnion("mensaje")
 
  })

  }

    }

     if(snapshot.empty){
 
    
      await  db.collection('/mensajes_privados').add({
         usuario_1,
         usuario_2,
         mensaje,
         hora,
         codigo_chat:codigo
     })

    const docRef2 = db.collection('mensaje_final');
    const snapshot_usuario_1 = await docRef2.where('usuario_1.nombre','==', usuario_1.nombre).where('usuario_2.nombre','==', usuario_2.nombre).get();
 
    const snapshot_usuario_2 = await docRef2.where('usuario_1.nombre','==', usuario_2.nombre).where('usuario_2.nombre','==', usuario_1.nombre).get();
 
 
    if(snapshot_usuario_1.empty && snapshot_usuario_2.empty){
 
     const mensaje_final = mensaje.texto
     await db.collection('/mensaje_final').add({
       usuario_1,
       usuario_2,
       mensaje_final,
       hora,
       codigo_chat:codigo
   })
  //  res.send("mensaje_enviado");
  chatNamespace.to(nombre_sala_cliente).emit('mensaje_usuario', mensajeRecibido); // Enviar el mensaje a todos en el chat

   return;
 }
   else if(!snapshot_usuario_2.empty){
     const doc = snapshot_usuario_2.docs[0];
 
     const id = doc.ref.id; 
    
     const mensaje_final = mensaje.texto
 
   
   
         await db.collection('/mensaje_final').doc(id).update({
           mensaje_final,
           hora
       });
       // res.send("mensaje_enviado");
       chatNamespace.to(nombre_sala_cliente).emit('mensaje_usuario', mensajeRecibido); // Enviar el mensaje a todos en el chat

       return;
   }
 
  else if(!snapshot_usuario_1.empty){
     const doc = snapshot_usuario_1.docs[0];
 
     const id = doc.ref.id; 
    
     const mensaje_final = mensaje.texto
 
   
   
         await db.collection('/mensaje_final').doc(id).update({
           mensaje_final,
           hora
       });
       chatNamespace.to(nombre_sala_cliente).emit('mensaje_usuario', mensajeRecibido); // Enviar el mensaje a todos en el chat

       //res.send("mensaje_enviado");
       return;
   }
 
    }
   
 
    chatNamespace.to(nombre_sala_cliente).emit('mensaje_usuario', mensajeRecibido); // Enviar el mensaje a todos en el chat
  });

  socket.on('disconnect', () => {
    console.log('Un cliente se ha desconectado del chat');
  });
});
//const server = https.createServer({
 // key: fs.readFileSync('/etc/letsencrypt/live/tudominio.com/privkey.pem'),
 // cert: fs.readFileSync('/etc/letsencrypt/live/tudominio.com/fullchain.pem')
//}, app_2);
//server.listen(4000, () => {
 // console.log('Server is running on port 4000');
//});
 //CHAT EN TIEMPO REAL
  //chatNamespace.on('connection', (socket) => {
   //console.log('Un cliente se ha conectado al chat');

   //socket.on('mensaje', (data) => {

     //console.log('Mensaje recibido en el chat:', data);
     //chatNamespace.emit('mensaje', data); // Enviar el mensaje a todos en el chat
   //});

   //socket.on('disconnect', () => {
     //console.log('Un cliente se ha desconectado del chat');
   //}); 
 //});

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
        
      //  console.log("email:",email);
        
        console.log("funcion iniciada: auth");
       

       // console.log(email);
        const email_base_de_datos = await db.collection('usuario').where('email', '==', email).get();
       // console.log(email_base_de_datos)

        if(!email_base_de_datos.empty){
            
         const doc = email_base_de_datos.docs[0].data();
   
         //console.log(doc);
            res.send(doc);
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


  router.post('/subir_uid', async (req, res) => {

    try {
        const { email, uid } = req.body; // Extraer el correo electrónico del cuerpo de la solicitud
        
        console.log("funcion iniciada: subir_uid");
 
       // console.log(email);
        const email_base_de_datos = await db.collection('usuario').where('email', '==', email).get();
       // console.log(email_base_de_datos)

        if(!email_base_de_datos.empty){

        db.collection('usuario').add({
          uid
        });
            res.send('Usuario creado');
        }
        else if(email_base_de_datos.empty){
        res.send('no se encontro el usuario');

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
  // Combina la fecha y la hora en una sola cadena
const fechaHoraStr = `${fecha} ${hora}`;

// Convierte la cadena combinada a un objeto Date
const fecha_nueva = new Date(fechaHoraStr.replace(/(\d{2})-(\d{2})-(\d{4})/, '$3-$2-$1'));

// Crea un objeto Timestamp de Firebase
const tiempo_subida = admin.firestore.Timestamp.fromDate(fecha_nueva);

   if (snapshot.empty) {
   
       await docRef.add({
        direccion, lat,lng,hora,fecha,comunidad,
        titulo,texto,tiempo_subida
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


      const num_pag = 1;

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
 

   const codigo_publicacion = generarPalabraAleatoria(generarNumeroAleatorio())+generarPalabraAleatoria(generarNumeroAleatorio())+generarPalabraAleatoria(generarNumeroAleatorio())+generarPalabraAleatoria(generarNumeroAleatorio())
   const codigo_comentario = generarPalabraAleatoria(generarNumeroAleatorio())+generarPalabraAleatoria(generarNumeroAleatorio())+generarPalabraAleatoria(generarNumeroAleatorio())+generarPalabraAleatoria(generarNumeroAleatorio())

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

const num_respuestas = 0
     const hora = admin.firestore.Timestamp.now();

comentarios.codigo_comentario = codigo_comentario
await db.collection('temas').add({
  creador,
  comentarios,
  titulo,
  comunidad,
  num_pag,
  codigo_publicacion,
  hora
 
})


await db.collection('tema_foro').add({
  creador,
  comentarios,
  titulo,
  comunidad,
  num_serie,
  num_pag,
  codigo_publicacion,
   num_respuestas
})

res.send('Tema creado');





}
 
     
    


       
     
     
  } catch (error) {
      console.error('Error subiendo el maps:', error);
      res.status(500).send('Error creando usuario');
  }
});

//router.post('/acion',  subida.single('file'), async (req, res) => {
  router.post('/subir_publicacion',  subida.array('files',10), async (req, res) => {

  
  // Obtener la imagen

  try{
    const {nombre, descripcio, publicacion_nueva,categoria}  = req.body; 
    console.log("funcion iniciada:  subir_publicacion");
  
  
    const es_video = false;
  // console.log(publicacion_nueva);
    const publicaciones = JSON.parse(publicacion_nueva);
   // console.log(req.file);
    //console.log(nombre);
  
    var filename =[];
    const url_publicacion = [];
   // console.log("files:",req.files);
    for (let i = 0; i < req.files.length; i++) {
    const imagen = req.files[i].path;
    const imageBuffer = fs.readFileSync(imagen);
   // console.log("la imagen es:",imagen);
  
  
    // Definir el nuevo tamaño (aumentar resolución)
   const newWidth = 1200; // Ajusta según lo que necesites
  const newHeight = 2000; // Mantén la proporción o ajusta
  // Redimensionar la imagen con sharp
  const resizedImageBuffer = await sharp(imageBuffer).resize(newWidth, newHeight, { fit: "inside" }).jpeg({ quality: 70 }).toBuffer(); // Ajusta el modo de escalado
  
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
  const hora = admin.firestore.FieldValue.serverTimestamp();
  const codigo_publicacion = generarPalabraAleatoria(generarNumeroAleatorio())+generarPalabraAleatoria(generarNumeroAleatorio())+generarPalabraAleatoria(generarNumeroAleatorio())
     await db.collection('publicaciones').add({
      usuario,
      categoria,
      descripcio,
      url_publicacion,
      num_coment,
      num_compartits,
      fecha_publicacion: formattedDate,
      num_likes,
      filename,
      es_video,
      codigo_publicacion,
      hora
    })

  
  const snapshot_usuario = await docRef.where('nombre', '==', nombre).get();

  if(!snapshot_usuario.empty){
    
     const doc = snapshot_usuario.docs[0];
     //const data  = doc.data();
     const data = doc.data();
     const id = doc.ref.id; 
     await db.collection('/usuario').doc(id).update({
     num_publicaciones : admin.firestore.FieldValue.increment(1)
})
  }

    //await db.collection('/usuario').doc(id).update({
     // publicaciones
  //});
    res.send('Publicacion subida correctamente');
  
  }
  
  }
  catch(error){
    console.log("Error subir_publicacion:"+error)
  }
    
  


});



router.post('/subir_publicacion/comunidad',  subida.array('files',10), async (req, res) => {

  
  // Obtener la imagen

    
  try{
    const {nombre, descripcio, publicacion_nueva,categoria, comunidad}  = req.body; 
    console.log("funcion iniciada:  subir_publicacion/comunidad");
  
  
  
  // console.log(publicacion_nueva);
    const publicaciones = JSON.parse(publicacion_nueva);
   // console.log(req.file);
    //console.log(nombre);
  
    var filename =[];
    const url_publicacion = [];
    for (let i = 0; i < req.files.length; i++) {
    const imagen = req.files[i].path;
    console.log("la imagen es:",imagen);
    const imageBuffer = fs.readFileSync(imagen);
  
  
    // Definir el nuevo tamaño (aumentar resolución)
  const newWidth = 2800; // Ajusta según lo que necesites
  const newHeight = 1500; // Mantén la proporción o ajusta manualmente
  
  // Redimensionar la imagen con sharp
  const resizedImageBuffer = await sharp(imageBuffer).resize(newWidth, newHeight, { fit: "cover" }).toBuffer(); // Ajusta el modo de escalado
  
   // console.log(req.files);
    
    // Nombre de archivo único, puedes generar uno con la fecha actual, por ejemplo
    const filename1 = `publicaciones_comunidad/Perfil_Image_${Date.now()}.jpg`;
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
  const hora = admin.firestore.FieldValue.serverTimestamp();
  const codigo_publicacion = generarPalabraAleatoria(generarNumeroAleatorio())+generarPalabraAleatoria(generarNumeroAleatorio())+generarPalabraAleatoria(generarNumeroAleatorio())+generarPalabraAleatoria(generarNumeroAleatorio())

     await db.collection('publicaciones_comunidad').add({
      usuario,
      categoria,
      descripcio,
      url_publicacion,
      num_coment,
      num_compartits,
      fecha_publicacion: formattedDate,
      num_likes,
      filename,
      comunidad,
      hora,
      codigo_publicacion
    })
  
    res.send('Publicacion subida correctamente');
  
  }
  
  }
  catch(error){
    console.log("error subir_publicacion/comunidad:"+error)
  }



});
router.post('/subir_publicacion/history',  subida.array('files',10), async (req, res) => {

  
  // Obtener la imagen

    
  try{
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
  }
  catch(error){
    console.log("error en subir_publicacion/history: "+error)
  }
  



});


router.post('/subir_publicacion/video',  subida.single('file'), async (req, res) => {

  
  try{
  // Obtener la imagen 
  const video = req.file.path;  
  const {nombre, descripcio, publicacion_nueva,categoria_nueva}  = req.body; 
  const es_video = true;
  console.log("funcion iniciada: acion/video");

  const categoria = parseInt(categoria_nueva,10)
 //console.log(publicacion_nueva);
  const publicaciones = JSON.parse(publicacion_nueva);
 // console.log(req.file);
  //console.log(nombre);

  const videoBuffer = fs.readFileSync(video);

  const url_publicacion = [];
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
 const [signedUrl] = await file.getSignedUrl({
     action: 'read',
     expires: '03-09-2026', // Fecha de expiración del enlace. Ajusta según sea necesario
       });
  //console.log("La url de la imagen es:",url_publicacion);
  url_publicacion.push(signedUrl);

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
 const codigo_publicacion = generarPalabraAleatoria(generarNumeroAleatori())+nombre+generarPalabraAleatoria(generarNumeroAleatorio())+generarPalabraAleatoria(generarNumeroAleatorio())
 const hora = admin.firestore.FieldValue.serverTimestamp();


   await db.collection('publicaciones').add({
    usuario,
    categoria,
    descripcio,
    url_publicacion,
    num_coment,
    num_compartits,
    fecha_publicacion: formattedDate,
    num_likes,
    es_video,
    codigo_publicacion,
    hora
  })
  await db.collection('/usuario').doc(id).update({
    publicaciones
});
  res.send('Publicacion subida correctamente');

}

  }
catch(error){
  console.log("Error en subir_publicacion/video:"+error)
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
const hora = admin.firestore.FieldValue.serverTimestamp();

// Formatear la fecha
const num_seguidores = 1;
const formattedDate = format(now, 'dd-MM-yyyy HH:mm:ss');
   await db.collection('comunidades').add({
  
    nombre,
    descripcion,
    foto_perfil,
    Miembros,
   creador,
   publica,
   fecha_creacion:formattedDate,
   hora,
   num_seguidores

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

    const num_seguidores = Miembros.length
    await db.collection('/comunidades').doc(id).update({
      Miembros,
      Solicitudes,
      num_seguidores
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
const usuario_token = await docRef_3.where('nombre', '==', Comunidad.creador).get();

const token = usuario_token.docs[0].data().token;

const titulo = "Has recibido un like"
const texto = "El usuario:,"+usuario_iniciado.nombre+" ha solicitado entrar en la Comunidad:"+Comunidad.nombre
enviarNotificacion(token,titulo,texto)




const usuario_likeado = await docRef_3.where('nombre', '==', Comunidad.creador).get();
const nombre_usuario_likeado = usuario_likeado.docs[0].data().nombre;
const foto_perfil_usuario_likeado= usuario_likeado.docs[0].data().foto_perfil;

const usuario = {
  nombre:nombre_usuario_likeado,
  foto_perfil:foto_perfil_usuario_likeado
}
const now = admin.firestore.Timestamp.now();
      const notificaciones = usuario_likeado.docs[0].data().notificaciones;
if(!notificaciones.includes("noti")){

    
      const doc = usuario_likeado.docs[0];
   


      //mirar bé apartir de aquí

      const id = doc.ref.id; 

          await db.collection('/usuario').doc(id).update({
     
    notificaciones: admin.firestore.FieldValue.arrayUnion("noti")

  })

  }
if(!notificaciones.includes("comunidad")){
     notificaciones.push("comunidad");

    
      const doc = usuario_likeado.docs[0];
   


      //mirar bé apartir de aquí

      const id = doc.ref.id; 

          await db.collection('/usuario').doc(id).update({
     
notificaciones: admin.firestore.FieldValue.arrayUnion("comunidad")
  })

  }
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

router.post('/bajar_publicacion/comunidad', async (req, res) => {
  const { comunidad , hora} = req.body
  //console.log(req.body);
  console.log("funcion iniciada: bajar_publicacion/comunidad");
  const horaTimestamp = new admin.firestore.Timestamp(
    Math.floor(Number(hora._seconds)),
    Math.floor(Number(hora._nanoseconds))
  );
  
  const docRef = db.collection('publicaciones_comunidad');
 // const snapshot = await docRef.where('descripcio', '==', descripcio).get();

  const snapshot = await docRef.where('comunidad', '==', comunidad).orderBy('hora','desc').startAfter(horaTimestamp).limit(10).get();
  if (snapshot.empty) {
      console.log('No se encontro la publicacion.');
      res.send("No se encontro la publicacion");
      return;
  } 

  else{


      const docsData = snapshot.docs.map(doc => doc.data());
  

    //  console.log(docsData);
      res.send(docsData)

  }

   

   

});



router.post('/bajar_publicacion', async (req, res) => {
  const { _nanoseconds, _seconds, usuario} = req.body
  console.log("funcion iniciada: bajar_publicacion");

  //console.log(req.body);
  //console.log("hora:",_seconds);
  const horaTimestamp = new admin.firestore.Timestamp(
    Math.floor(Number(_seconds)),
    Math.floor(Number(_nanoseconds))
  );

  const notificaciones = usuario.notificaciones
   // console.log(notificaciones);

  if(notificaciones.includes('home')){

 //& const notificaciones2 = notificaciones.filter(item => item !== 'home');
  //console.log(notificaciones2);
 const docRef2 = db.collection('usuario');
    const snapshot = await docRef2.where('nombre', '==', usuario.nombre).get();

    
    const doc = snapshot.docs[0];
   

    //mirar bé apartir de aquí

    const id = doc.ref.id; 

 //   console.log("la url del tema es:",id)


    await db.collection('/usuario').doc(id).update({
     
      notificaciones:admin.firestore.FieldValue.arrayRemove('home')
  })

  }

  
  const docRef = db.collection('publicaciones');
 // const snapshot = await docRef.where('descripcio', '==', descripcio).get();

  const snapshot = await docRef.orderBy('hora','desc').startAfter(horaTimestamp).limit(10).get();
  if (snapshot.empty) {
      console.log('No se encontro la publicacion.');
      return;
  } 

  else{


      const docsData = snapshot.docs.map(doc => doc.data());
  
      //const ultimoDoc = snapshot.docs[snapshot.docs.length - 1];
    //  const nuevaUltimaHora = ultimoDoc.data().hora;

      //console.log(docsData);
     // res.json({
     //   publicaciones: docsData,
      //  ultimaHora: nuevaUltimaHora.toDate().toISOString() // Envía como string ISO
     // });
      res.send(docsData)

  }

   

   

});


router.post('/bajar_publicacion/seguidores', async (req, res) => {
  const { hora, seguidores} = req.body
 
// console.log(req.body);
  if(!seguidores.empty){

  
  console.log("funcion iniciada: bajar_publicacion/seguidores");

  const horaTimestamp = new admin.firestore.Timestamp(
    Math.floor(Number(hora._seconds)),
    Math.floor(Number(hora._nanoseconds))
  );
  const docRef = db.collection('publicaciones');
 // const snapshot = await docRef.where('descripcio', '==', descripcio).get();

  const snapshot = await docRef.where('usuario.nombre', 'in', seguidores).orderBy('hora','desc').startAfter(horaTimestamp).limit(10).get();
  if (snapshot.empty) {
      console.log('No se encontro la publicacion.');
      res.send("No hay publicaciones");

      return;
  } 

  else{


      const docsData = snapshot.docs.map(doc => doc.data());
  

  
      res.send(docsData)

  }

   
}
else{
  res.send("No hay publicaciones");
}
   

});

router.post('/bajar_publicacion/ranking', async (req, res) => {
  const { hora_inicial, hora_final} = req.body
  console.log(req.body);
  console.log("funcion iniciada: bajar_publicacion/ranking");

 // console.log(req.body);
  //console.log("hora:",_seconds);
  const horaTimestamp_inicial = new admin.firestore.Timestamp(
    Math.floor(Number(hora_inicial._seconds)),
    Math.floor(Number(hora_inicial._nanoseconds))
  );
  const horaTimestamp_final = new admin.firestore.Timestamp(
    Math.floor(Number(hora_final._seconds)),
    Math.floor(Number(hora_final._nanoseconds))
  );
  const docRef = db.collection('publicaciones');
 // const snapshot = await docRef.where('descripcio', '==', descripcio).get();

const snapshot = await docRef
  .where('hora', '>=', horaTimestamp_final)
  .where('hora', '<', horaTimestamp_inicial)
  .orderBy('likes_total', 'desc')
  .limit(10)
  .get();


  if (snapshot.empty) {
      console.log('No se encontro la publicacion.');
      return;
  } 

  else{


    
      const docsData = snapshot.docs.map(doc => doc.data());
  
      //const ultimoDoc = snapshot.docs[snapshot.docs.length - 1];
    //  const nuevaUltimaHora = ultimoDoc.data().hora;

      //console.log(docsData);
     // res.json({
     //   publicaciones: docsData,
      //  ultimaHora: nuevaUltimaHora.toDate().toISOString() // Envía como string ISO
     // });
      res.send(docsData)

  }

   

   

});
router.post('/bajar_publicacion/categoria_ranking', async (req, res) => {
  const { hora_inicial, hora_final, categoria} = req.body
  //console.log(req.body);
  console.log("funcion iniciada: bajar_publicacion/categoria_ranking");

  //console.log("categoria:",categoria);
 // console.log(req.body);
  //console.log("hora:",_seconds);
  const horaTimestamp_inicial = new admin.firestore.Timestamp(
    Math.floor(Number(hora_inicial._seconds)),
    Math.floor(Number(hora_inicial._nanoseconds))
  );
  const horaTimestamp_final = new admin.firestore.Timestamp(
    Math.floor(Number(hora_final._seconds)),
    Math.floor(Number(hora_final._nanoseconds))
  );
  const docRef = db.collection('publicaciones');
 // const snapshot = await docRef.where('descripcio', '==', descripcio).get();

  const snapshot = await docRef.where('categoria', '==', categoria) .where('hora', '>=', horaTimestamp_final).where('hora', '<', horaTimestamp_inicial).orderBy('categoria').orderBy('hora','desc').startAfter(horaTimestamp_inicial).limit(10).get();

  if (snapshot.empty) {
      console.log('No se encontro la publicacion.');
      res.send('No se encontro la publicacion.');
      return;
  } 

  else{

    console.log('Se encontro la publicacion.');


      const docsData = snapshot.docs.map(doc => doc.data());
  
      //const ultimoDoc = snapshot.docs[snapshot.docs.length - 1];
      //const nuevaUltimaHora = ultimoDoc.data().hora;

      //console.log(docsData);
     // res.json({
     //   publicaciones: docsData,
      //  ultimaHora: nuevaUltimaHora.toDate().toISOString() // Envía como string ISO
     // });
      res.send(docsData)

  }

   

   

});
router.post('/bajar_publicacion/categoria', async (req, res) => {
  const { _nanoseconds, _seconds, categoria} = req.body
  //console.log(req.body);
  console.log("funcion iniciada: bajar_publicacion/categoria");

 // console.log("categoria:",categoria);
//  console.log(req.body);
 // console.log("hora:",_seconds);
  const horaTimestamp = new admin.firestore.Timestamp(
    Math.floor(Number(_seconds)),
    Math.floor(Number(_nanoseconds))
  );
  const docRef = db.collection('publicaciones');
 // const snapshot = await docRef.where('descripcio', '==', descripcio).get();

  const snapshot = await docRef.where('categoria', '==', categoria).orderBy('categoria').orderBy('hora','desc').startAfter(horaTimestamp).limit(10).get();
  if (snapshot.empty) {
      console.log('No se encontro la publicacion.');
      res.send('No se encontro la publicacion.');
      return;
  } 

  else{


      const docsData = snapshot.docs.map(doc => doc.data());
  
      //const ultimoDoc = snapshot.docs[snapshot.docs.length - 1];
      //const nuevaUltimaHora = ultimoDoc.data().hora;

      //console.log(docsData);
     // res.json({
     //   publicaciones: docsData,
      //  ultimaHora: nuevaUltimaHora.toDate().toISOString() // Envía como string ISO
     // });
      res.send(docsData)

  }

   

   

});
router.post('/eliminar_publicacion', async (req, res) => {
  const { descripcio ,nombre, codigo_publicacion} = req.body
  //console.log(req.body);
  console.log("funcion iniciada: eliminar_publicacion");

  
  const docRef = db.collection('publicaciones');

  const docRef2 = db.collection('publicacion_likeada');

 // const snapshot = await docRef.where('descripcio', '==', descripcio).get();

  const snapshot = await docRef.where('usuario.nombre', '==', nombre).where('codigo_publicacion', '==', codigo_publicacion).get();
  const snapshot_publicacion_likeada = await docRef2.where('nombre', '==', nombre).where('codigo_publicacion', '==', codigo_publicacion).get();


  if(!snapshot_publicacion_likeada.empty){
    const doc2 = snapshot_publicacion_likeada.docs[0]
    const id = doc2.ref.id
    db.collection('/publicacion_likeada').doc(id).delete();

  }

  if (snapshot.empty) {
      console.log('No se encontro la publicacion.');
      return;
  } 

  else{


    const doc = snapshot.docs[0]
      const id = doc.ref.id
      const { filename } = doc.data(); // Obtén el array de filenames
      if (Array.isArray(filename)) {
  
        
        filename.forEach(file => {
          bucket.file(file).delete();
        });
      }
  
  
  
       db.collection('/publicaciones').doc(id).delete();
  
     const snapshot_usuario = await docRef.where('nombre', '==', nombre).get();

  if(!snapshot_usuario.empty){
    
     const doc = snsnapshot_usuario.docs[0];
     //const data  = doc.data();
     const data = doc.data();
     const id = doc.ref.id; 
     await db.collection('/usuario').doc(id).update({
     num_publicaciones : admin.firestore.FieldValue.increment(-1)
})
  }

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
  const { descripcio ,nombre, codigo_publicacion} = req.body
  //console.log(req.body);
  console.log("funcion iniciada: editar_publicacion");

  
  const docRef2 = db.collection('publicacion_likeada');

 // const snapshot = await docRef.where('descripcio', '==', descripcio).get();

//  const snapshot = await docRef.where('usuario.nombre', '==', nombre).where('descripcio', '==', descripcio).get();
 // const snapshot_publicacion_likeada = await docRef2.where('nombre', '==', nombre).where('codigo_publicacion', '==', codigo_publicacion).get();


 // if(!snapshot_publicacion_likeada.empty){
   // const doc2 = snapshot_publicacion_likeada.docs[0]
    //const id = doc2.ref.id
    //db.collection('/publicacion_likeada').doc(id).update({
     // descripcio
    //} );

  //}
  const docRef = db.collection('publicaciones');
 // const snapshot = await docRef.where('descripcio', '==', descripcio).get();

  const snapshot = await docRef.where('usuario.nombre', '==', nombre).where('codigo_publicacion', '==', codigo_publicacion).get();
  if (snapshot.empty) {
      console.log('No se encontro la publicacion.');
      return;
  } 

  else{

    const id = snapshot.docs[0].ref.id
    db.collection('/publicaciones').doc(id).update({
      descripcio
    });


    res.send("Publicacion editada");

  }

   

   

});

router.post('/bajar_comentarios/publicacion', async (req, res) => {
  const { codigo_publicacion, nombre, hora, likes} = req.body
  //console.log(req.body);
  console.log("funcion iniciada: bajar_comentarios/publicacion");

  const like = parseInt(likes);
  //console.log("codigo_publicacion:",codigo_publicacion);
  //cconsole.log("nombre:",nombre);
console.log("like:",like);
  if(like > 0){
    console.log(like);
  const docRef = db.collection('comentaris_publicacion');
 const snapshot = await docRef.where('nombre', '==', nombre).where('codigo_publicacion', '==', codigo_publicacion).orderBy("likes_total","desc").endBefore(0).limit(10).get();

  //const snapshot = await docRef.where('usuario.nombre', '==', nombre).get();
  if (snapshot.empty) {
      console.log('No se encontro comentarios de esta publicacion.');
      res.send("No se encontro comentarios con likes");
      return;
  } 

  else{  


        
       
 // console.log("Hemos llegado aqui")
 const docsData = snapshot.docs.map(doc => {
  const { comentaris, hora , num_respuestas} = doc.data();
 // Obtén solo el campo "comentario"
  if (comentaris) {
    const { fecha_publicacion, usuario, texto, num_serie,  likes, respuestas, codigo_publicacion, codigo_comentario} = comentaris; // Extrae "nombre" y "texto"

    return { fecha_publicacion, usuario, texto, num_serie,  likes, respuestas, codigo_publicacion, hora, codigo_comentario, num_respuestas}; // Devuelve solo estos campos
  }});
//console.log(docsData);
res.send(docsData);

  }

}
else{
  const docRef = db.collection('comentaris_publicacion');

  const horaTimestamp = new admin.firestore.Timestamp(
    Math.floor(Number(hora._seconds)),
    Math.floor(Number(hora._nanoseconds))
  );


  const snapshot = await docRef.where('nombre', '==', nombre).where('codigo_publicacion', '==', codigo_publicacion).where('likes_total', '==', 0).orderBy('hora','desc').startAfter(horaTimestamp).limit(10).get();

   //const snapshot = await docRef.where('usuario.nombre', '==', nombre).get();
   if (snapshot.empty) {
    console.log('No se encontro comentarios de esta publicacion.');
    res.send("No se encontro comentarios de esta publicacion");
    return;
} 

else{


      
 // console.log("Hemos llegado aqui")
  const docsData = snapshot.docs.map(doc => {
    const { comentaris, hora , num_respuestas} = doc.data();
   // Obtén solo el campo "comentario"
    if (comentaris) {
      const { fecha_publicacion, usuario, texto, num_serie,  likes, respuestas, codigo_publicacion, codigo_comentario} = comentaris; // Extrae "nombre" y "texto"

      return { fecha_publicacion, usuario, texto, num_serie,  likes, respuestas, codigo_publicacion, hora, codigo_comentario, num_respuestas}; // Devuelve solo estos campos
    }});
  //console.log(docsData);
  res.send(docsData);


}

}

   

});
router.post('/bajar_comentario_publicacion/respuesta', async (req, res) => {
  const { nombre, codigo_publicacion, codigo_comentario, num_serie} = req.body
  //console.log(req.body);
  console.log("funcion iniciada: bajar_comentario_publicacion/respuesta");


  const docRef = db.collection('comentarios_publicacion_respuesta');
 const snapshot = await docRef.where('nombre', '==', nombre).where('codigo_publicacion', '==', codigo_publicacion).where('codigo_comentario', '==', codigo_comentario).orderBy("num_serie").startAt(num_serie).limit(10).get();

  //const snapshot = await docRef.where('usuario.nombre', '==', nombre).get();
  if (snapshot.empty) {
      console.log('No se encontro comentarios de esta publicacion.');
      res.send("No se encontro respuestas");
      return;
  } 

  else{  


        
       
 // console.log("Hemos llegado aqui")
 const docsData = snapshot.docs.map(doc => {
  const { comentaris  } = doc.data();
 // Obtén solo el campo "comentario"
  if (comentaris) {
    const { fecha_publicacion, usuario, texto, num_serie,  likes, respuestas, codigo_publicacion} = comentaris; // Extrae "nombre" y "texto"

    return { fecha_publicacion, usuario, texto, num_serie,  likes, respuestas, codigo_publicacion}; // Devuelve solo estos campos
  }});
//console.log(docsData);
res.send(docsData);

  }



   

});

router.post('/bajar_comentario_comunidad/respuesta', async (req, res) => {
  const { nombre, codigo_publicacion, codigo_comentario, titulo, comunidad} = req.body
  //console.log(req.body);
  console.log("funcion iniciada: bajar_comentario_comunidad/respuesta");


  const docRef = db.collection('tema_foro_respuestas');
 const snapshot = await docRef.where('comunidad', '==', comunidad).where('codigo_publicacion', '==', codigo_publicacion).where('codigo_comentario', '==', codigo_comentario).orderBy("num_serie").startAt(1).limit(10).get();

  //const snapshot = await docRef.where('usuario.nombre', '==', nombre).get();
  if (snapshot.empty) {
      console.log('No se encontro comentarios de esta publicacion.');
      res.send("No se encontro respuestas");
      return;
  } 

  else{  


        
       
 // console.log("Hemos llegado aqui")
 const docsData = snapshot.docs.map(doc => {
  const { comentarios  } = doc.data();
 // Obtén solo el campo "comentario"
  if (comentarios) {
    const { fecha_publicacion, usuario, texto, num_serie,  likes, respuestas, codigo_publicacion, codigo_comentario} = comentarios; // Extrae "nombre" y "texto"

    return { fecha_publicacion, usuario, texto, num_serie,  likes, respuestas, codigo_publicacion, codigo_comentario}; // Devuelve solo estos campos
  }});
//console.log(docsData);
res.send(docsData);

  }



   

});

router.post('/bajar_publicacion_usuario', async (req, res) => {
  const { nombre, hora} = req.body
 // console.log(req.body);
  console.log("funcion iniciada: bajar_publicacion_usuario");

  
  const docRef = db.collection('publicaciones');
 // const snapshot = await docRef.where('descripcio', '==', descripcio).get();
 const horaTimestamp = new admin.firestore.Timestamp(
  Math.floor(Number(hora._seconds)),
  Math.floor(Number(hora._nanoseconds))
);
  const snapshot = await docRef.where('usuario.nombre', '==', nombre).orderBy('hora','desc').startAfter(horaTimestamp).limit(12).get();
  if (snapshot.empty) {
      console.log('No hay publicaciones');
      res.send('No hay publicaciones');
      return;
  } 

  else{


      const docsData = snapshot.docs.map(doc => doc.data());
  

  //    console.log(docsData);
      res.send(docsData)

  }

   

   

});
router.post('/bajar_publicacion_selecionada', async (req, res) => {
  const { nombre, codigo_publicacion } = req.body
  //console.log(req.body);
  console.log("funcion iniciada: bajar_publicacion_selecionada");

  
  const docRef = db.collection('publicaciones');
 // const snapshot = await docRef.where('descripcio', '==', descripcio).get();

  const snapshot = await docRef.where('usuario.nombre', '==', nombre).where('codigo_publicacion', '==', codigo_publicacion).get();
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
router.post('/bajar_comunidad_categoria', async (req, res) => {

  try{
    console.log("funcion iniciada: bajar_comunidad_categoria ");

    const { uid, token, hora, categoria } = req.body

   // const decodedToken = await admin.auth().verifyIdToken(token);

   // if(decodedToken.uid === uid){

      const horaTimestamp = new admin.firestore.Timestamp(
        Math.floor(Number(hora._seconds)),
        Math.floor(Number(hora._nanoseconds))
      );

  // console.log('nombre:',nombre);
   const docRef = db.collection('comunidades');
   const snapshot = await docRef.orderBy('hora','desc').where('hora', '<=', horaTimestamp).where('categoria', '==', categoria).limit(10).get();
   //const snapshot = await docRef.where('nombre', '==', nombre).get();
   if (snapshot.empty) {
       console.log('No se encontro ninguna comunidad.');
       res.send('No se encontro ninguna comunidad.');
       return;
   } 
 
   else{
 
 
 
       const docsData = snapshot.docs.map(doc => doc.data());
     // console.log("los mapas encontrados son:",docsData)
 
 
       res.send(docsData)
 
 //  }
 
    

  }
}
  catch(error){
    console.log("Error en bajar_comunidad:"+error)
  }


});
router.post('/bajar_comunidad', async (req, res) => {

  try{
    console.log("funcion iniciada: bajar_comunidad ");

    const { uid, token, hora, notificaciones, nombre } = req.body
  //  console.log(notificaciones);
  
  if(notificaciones.includes('comunidad')){

 const docRef2 = db.collection('usuario');
    const snapshot = await docRef2.where('nombre', '==', nombre).get();

    
    const doc = snapshot.docs[0];
   

    //mirar bé apartir de aquí

    const id = doc.ref.id; 

 //   console.log("la url del tema es:",id)


    await db.collection('/usuario').doc(id).update({
     
      notificaciones:admin.firestore.FieldValue.arrayRemove('comunidad')
  })

  }
   // const decodedToken = await admin.auth().verifyIdToken(token);

   // if(decodedToken.uid === uid){

      const horaTimestamp = new admin.firestore.Timestamp(
        Math.floor(Number(hora._seconds)),
        Math.floor(Number(hora._nanoseconds))
      );

  // console.log('nombre:',nombre);
   const docRef = db.collection('comunidades');
   const snapshot = await docRef.orderBy('hora','desc').startAfter(horaTimestamp).limit(10).get();
   //const snapshot = await docRef.where('nombre', '==', nombre).get();
   if (snapshot.empty) {
       console.log('No se encontro ninguna comunidad.');
       res.send('No se encontro ninguna comunidad.');
       return;
   } 
 
   else{
 
 
 
       const docsData = snapshot.docs.map(doc => doc.data());
     // console.log("los mapas encontrados son:",docsData)
 
 
       res.send(docsData)
 
 //  }
 
    

  }
}
  catch(error){
    console.log("Error en bajar_comunidad_categoria:"+error)
  }


});

router.post('/bajar_comunidad_2', async (req, res) => {

  try{
    console.log("funcion iniciada: bajar_comunidad_2 ");

    const { uid, token, hora } = req.body

  //  const decodedToken = await admin.auth().verifyIdToken(token);

   // if(decodedToken.uid === uid){

      const horaTimestamp = new admin.firestore.Timestamp(
        Math.floor(Number(hora._seconds)),
        Math.floor(Number(hora._nanoseconds))
      );

  // console.log('nombre:',nombre);
   const docRef = db.collection('comunidades');
   const snapshot = await docRef.orderBy('hora').startAfter(horaTimestamp).limit(10).get();
   //const snapshot = await docRef.where('nombre', '==', nombre).get();
   if (snapshot.empty) {
       console.log('No se encontro ninguna comunidad.');
              res.send('No se encontro ninguna comunidad.');

       return;
   } 
 
   else{
 
 
 
       const docsData = snapshot.docs.map(doc => doc.data());
     // console.log("los mapas encontrados son:",docsData)
 
 
       res.send(docsData)
 
   }
 
    

 // }
}
  catch(error){
    console.log("Error en bajar_comunidad_2:"+error)
  }


});


router.post('/bajar_comunidad_2_categoria', async (req, res) => {

  try{
    console.log("funcion iniciada: bajar_comunidad_2_categoria ");

    const { uid, token, hora, categoria } = req.body

  //  const decodedToken = await admin.auth().verifyIdToken(token);

   // if(decodedToken.uid === uid){

      const horaTimestamp = new admin.firestore.Timestamp(
        Math.floor(Number(hora._seconds)),
        Math.floor(Number(hora._nanoseconds))
      );

  // console.log('nombre:',nombre);
   const docRef = db.collection('comunidades');
   const snapshot = await docRef.orderBy('hora').where('hora', '>=', horaTimestamp).where('categoria', '==', categoria).limit(10).get();
   //const snapshot = await docRef.where('nombre', '==', nombre).get();
   if (snapshot.empty) {
       console.log('No se encontro ninguna comunidad.');
              res.send('No se encontro ninguna comunidad.');

       return;
   } 
 
   else{
 
 
 
       const docsData = snapshot.docs.map(doc => doc.data());
     // console.log("los mapas encontrados son:",docsData)
 
 
       res.send(docsData)
 
   }
 
    

 // }
}
  catch(error){
    console.log("Error en bajar_comunidad_2_categoria:"+error)
  }


});
router.post('/bajar_comunidad_3', async (req, res) => {

  try{
    console.log("funcion iniciada: bajar_comunidad_3 ");

    const { uid, token, num_seguidores } = req.body

   

  // console.log('nombre:',nombre);
   const docRef = db.collection('comunidades');
   const snapshot = await docRef.orderBy('num_seguidores','desc').startAfter(num_seguidores).limit(10).get();
   //const snapshot = await docRef.where('nombre', '==', nombre).get();
   if (snapshot.empty) {
       console.log('No se encontro ninguna comunidad.');
              res.send('No se encontro ninguna comunidad.');

       return;
   } 
 
   else{
 
 
 
       const docsData = snapshot.docs.map(doc => doc.data());
     // console.log("los mapas encontrados son:",docsData)
 
 
       res.send(docsData)
 
   }
 
    

  }

  catch(error){
    console.log("Error en bajar_comunidad_3:"+error)
  }


});

router.post('/bajar_comunidad_3_categoria', async (req, res) => {

  try{
    console.log("funcion iniciada: bajar_comunidad_3_categoria ");

    const { uid, token, num_seguidores, categoria } = req.body

   

  // console.log('nombre:',nombre);
   const docRef = db.collection('comunidades');
  const snapshot = await docRef.orderBy('num_seguidores','desc').where('num_seguidores', '<=', num_seguidores).where('categoria','==', categoria).limit(10).get();
   //const snapshot = await docRef.where('nombre', '==', nombre).get();
   if (snapshot.empty) {
       console.log('No se encontro ninguna comunidad.');
              res.send('No se encontro ninguna comunidad.');

       return;
   } 
 
   else{
 
 
 
       const docsData = snapshot.docs.map(doc => doc.data());
     // console.log("los mapas encontrados son:",docsData)
 
 
       res.send(docsData)
 
   }
 
    

  }

  catch(error){
    console.log("Error en bajar_comunidad_3_categoria:"+error)
  }


});
router.post('/bajar_comunidad_4', async (req, res) => {

  try{
    console.log("funcion iniciada: bajar_comunidad_4 ");

    const { uid, token, comunidades_seguidas } = req.body

   

    console.log(comunidades_seguidas);
    if(!comunidades_seguidas.empty){
  // console.log('nombre:',nombre);
   const docRef = db.collection('comunidades');
   const snapshot = await docRef.where('nombre', 'in', comunidades_seguidas).limit(10).get();
   //const snapshot = await docRef.where('nombre', '==', nombre).get();
   if (snapshot.empty) {
       console.log('No se encontro ninguna comunidad.');
              res.send('No se encontro ninguna comunidad.');

       return;
   } 
 
   else{
 
 
 
       const docsData = snapshot.docs.map(doc => doc.data());
     // console.log("los mapas encontrados son:",docsData)
 
 
       res.send(docsData)
 
   }
    }

 
    

  }

  catch(error){
    console.log("Error en bajar_comunidad_4:"+error)
  }


});
router.post('/bajar_comunidad_4_categoria', async (req, res) => {

  try{
    console.log("funcion iniciada: bajar_comunidad_4_categoria ");

    const { uid, token, comunidades_seguidas, categoria} = req.body

   

    if(!comunidades_seguidas.epmty){
  // console.log('nombre:',nombre);
   const docRef = db.collection('comunidades');
   const snapshot = await docRef.where('nombre', 'in', comunidades_seguidas).where('categoria', '==', categoria).limit(10).get();
   //const snapshot = await docRef.where('nombre', '==', nombre).get();
   if (snapshot.empty) {
       console.log('No se encontro ninguna comunidad.');
              res.send('No se encontro ninguna comunidad.');

       return;
   } 
 
   else{
 
 
 
       const docsData = snapshot.docs.map(doc => doc.data());
     // console.log("los mapas encontrados son:",docsData)
 
 
       res.send(docsData)
 
   }
    }

 
    

  }

  catch(error){
    console.log("Error en bajar_comunidad_4_categoria:"+error)
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


router.post('/modificar_likes/mensajes_privados', async (req, res) => {
  try {
    const { mensaje, codigo_chat, hora, nombre } = req.body;
   // console.log(req.body);
    console.log('funcion iniciada: modificar_likes/mensajes_privados');

    const horaTimestamp = new admin.firestore.Timestamp(
      Math.floor(Number(hora._seconds)),
      Math.floor(Number(hora._nanoseconds))
    );
    const docRef = db.collection('mensajes_privados');
    const snapshot = await docRef
      .where('mensaje.autor', '==', nombre)
      .where('codigo_chat', '==', codigo_chat)
      .where('hora', '==', horaTimestamp)
      .get();
      if (snapshot.empty) {
        console.log('No se encontro el comentario .');
        return;
    } 
  
    else{
  
      const doc = snapshot.docs[0];
      const publicacion = snapshot.docs[0].data();
  
      //mirar bé apartir de aquí
      const id = doc.ref.id; 
  
   //console.log("la url del tema es:",id)
  
  
      await db.collection('/mensajes_privados').doc(id).update({
        mensaje
    })
  }
    if (snapshot.empty) {
      return res.status(404).json({ message: 'No se encontraron mensajes con esos criterios.' });
    }




    res.status(200).json({ message: 'Likes modificados correctamente.' });
  } catch (error) {
    console.error('Error al modificar likes:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
  
});




router.post('/modificar_likes', async (req, res) => {
try{
  const { nombre, fecha_publicacion, likes, nombre_iniciado, categoria, descripcio, codigo_publicacion, foto_perfil, likeado} = req.body
//console.log(nombre,fecha_publicacion);
const num_likeados = parseInt(likeado,10);
//console.log(req.body);
  const num_likes = JSON.parse(likes);

 //console.log(num_likes);
  console.log("funcion iniciada: modificar_likes");

//console.log('nombre:',nombre);
  const docRef = db.collection('publicaciones');
  const snapshot = await docRef.where('usuario.nombre', '==', nombre).where('codigo_publicacion', '==', codigo_publicacion).get();
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

const likes_total = num_likes.length; 
    await db.collection('/publicaciones').doc(id).update({
     num_likes,
     likes_total
  })
  descripcio
 // 
 const docRef_2 = db.collection('publicacion_likeada');
 const snapshot2 = await docRef_2.where('nombre', '==', nombre).get();

 if (!snapshot2.empty) {


  const doc = snapshot2.docs[0];
  //const publicacion = snapshot2.docs[0].data();

  //mirar bé apartir de aquí

  const id = doc.ref.id; 

//console.log("la url del tema es:",id)
//const num_likeados = num_likes.length;


await db.collection('/publicacion_likeada').doc(id).update({
     num_likeados : admin.firestore.FieldValue.increment(num_likeados)
})


} else{

  const num_likeados = num_likes.length;
  

  
  await db.collection('/publicacion_likeada').add({
    num_likeados, 
    categoria,
    nombre,
    foto_perfil
 })
}
 const docRef_cat = db.collection('publicacion_likeada_categoria');
 const snapshot3 = await docRef_cat.where('nombre', '==', nombre).where('categoria', '==', categoria).get();

 if (!snapshot3.empty) {


  const doc = snapshot3.docs[0];
  //const publicacion = snapshot2.docs[0].data();

  //mirar bé apartir de aquí

  const id = doc.ref.id; 

//console.log("la url del tema es:",id)
//const num_likeados = num_likes.length;


 
await db.collection('/publicacion_likeada_categoria').doc(id).update({
     num_likeados : admin.firestore.FieldValue.increment(num_likeados)
})


} else{

  const num_likeados = num_likes.length;
  

  
  await db.collection('/publicacion_likeada_categoria').add({
    num_likeados, 
    categoria,
    nombre,
    foto_perfil
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

 // await db.collection('/usuario').doc(id_usuario).update({
  //  publicaciones
 //})


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
      const notificaciones = usuario_likeado.docs[0].data().notificaciones;
if(!notificaciones.includes("noti")){

    
      const doc = usuario_likeado.docs[0];
   


      //mirar bé apartir de aquí

      const id = doc.ref.id; 

          await db.collection('/usuario').doc(id).update({
     
      notificaciones: admin.firestore.FieldValue.arrayUnion("noti")

  })

  }
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
   codigo_publicacion,
   expires_at

 })

 res.send("like enviado");
}
}
catch(error){
  console.log("Error en modificar_likes:"+error);
}
});
  




router.post('/modificar_likes/comunidad', async (req, res) => {

  const { nombre, fecha_publicacion, likes, nombre_iniciado, categoria, descripcio, foto_perfil} = req.body


  const num_likes = JSON.parse(likes);

 //console.log(num_likes);
  console.log("funcion iniciada: modificar_likes/comunidad");

//console.log('nombre:',nombre);
  const docRef = db.collection('publicaciones_comunidad');
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


    await db.collection('/publicaciones_comunidad').doc(id).update({
     num_likes
  })
  descripcio
 // 
 const docRef_2 = db.collection('publicacion_likeada');
 const snapshot2 = await docRef_2.where('nombre', '==', nombre).get();

 if (!snapshot2.empty) {


  const doc = snapshot2.docs[0];
  //const publicacion = snapshot2.docs[0].data();

  //mirar bé apartir de aquí

  const id = doc.ref.id; 

//console.log("la url del tema es:",id)
//const num_likeados = num_likes.length;


await db.collection('/publicacion_likeada').doc(id).update({
    num_likeados : admin.firestore.FieldValue.increment(1)
})


} else{

  const num_likeados = num_likes.length;
  
 //fecha_publicacion,
   // descripcio ,
  
  await db.collection('/publicacion_likeada').add({
    num_likeados, 
    categoria,
   foto_perfil,
    nombre
 })
}
const docRef_cat = db.collection('publicacion_likeada_categoria');
 const snapshot3 = await docRef_cat.where('nombre', '==', nombre).where('categoria', '==', categoria).get();

 if (!snapshot3.empty) {


  const doc = snapshot3.docs[0];
  //const publicacion = snapshot2.docs[0].data();

  //mirar bé apartir de aquí

  const id = doc.ref.id; 

//console.log("la url del tema es:",id)
//const num_likeados = num_likes.length;


await db.collection('/publicacion_likeada_categoria').doc(id).update({
     num_likeados : admin.firestore.FieldValue.increment(1)
})


} else{

  const num_likeados = num_likes.length;
  

  
  await db.collection('/publicacion_likeada_categoria').add({
    num_likeados, 
    categoria,
    nombre,
    foto_perfil
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

 // await db.collection('/usuario').doc(id_usuario).update({
  //  publicaciones
 //})


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
      const notificaciones = usuario_likeado.docs[0].data().notificaciones;
if(!notificaciones.includes("noti")){

    
      const doc = usuario_likeado.docs[0];
   


      //mirar bé apartir de aquí

      const id = doc.ref.id; 

          await db.collection('/usuario').doc(id).update({
     
     notificaciones: admin.firestore.FieldValue.arrayUnion("noti")

  })

  }
        //const notificaciones = usuario_likeado.docs[0].data().notificaciones;
if(!notificaciones.includes("comunidad")){

    
      const doc = usuario_likeado.docs[0];
   


      //mirar bé apartir de aquí

      const id = doc.ref.id; 

          await db.collection('/usuario').doc(id).update({
     
     notificaciones: admin.firestore.FieldValue.arrayUnion("comunidad")


  })

  }
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

    const { comentaris, usuario_iniciado, codigo_publicacion, publicacion, likeado} = req.body
   
  //  console.log(descripcio);

  const num_likes = parseInt(likeado, 10);
  
    // console.log(comentarios);
    console.log("funcion iniciada: modificar_likes/comentario_publi");
  
  //  console.log('nombre:',nombre);
    const docRef = db.collection('comentaris_publicacion');
    const snapshot = await docRef.where('comentaris.texto', '==', comentaris.texto).where('comentaris.num_serie', '==', comentaris.num_serie).where('codigo_publicacion', '==', codigo_publicacion).get();
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
        comentaris,
        likes_total : admin.firestore.FieldValue.increment(num_likes)
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
      const notificaciones = usuario_likeado.docs[0].data().notificaciones;
if(!notificaciones.includes("noti")){
     

    
      const doc = usuario_likeado.docs[0];
   


      //mirar bé apartir de aquí

      const id = doc.ref.id; 

          await db.collection('/usuario').doc(id).update({
     
      notificaciones: admin.firestore.FieldValue.arrayUnion("noti")

  })

  }

if(!notificaciones.includes("home")){

    
      const doc = usuario_likeado.docs[0];
   


      //mirar bé apartir de aquí

      const id = doc.ref.id; 

          await db.collection('/usuario').doc(id).update({
     
      notificaciones: admin.firestore.FieldValue.arrayUnion("home")

  })

  }

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



router.post('/modificar_likes/comentario_publi/respuesta', async (req, res) => {

  const { codigo_comentario, usuario_iniciado, codigo_publicacion, comentaris} = req.body
 
//  console.log(descripcio);



  // console.log(comentarios);
  console.log("funcion iniciada: modificar_likes/comentario_publi/respuesta");

//  console.log('nombre:',nombre);
  const docRef = db.collection('comentarios_publicacion_respuesta');
  const snapshot = await docRef.where('comentaris.texto', '==', comentaris.texto).where('comentaris.num_serie', '==', comentaris.num_serie).where('codigo_publicacion', '==', codigo_publicacion).where('codigo_comentario', '==', codigo_comentario).get();
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
    await db.collection('/comentarios_publicacion_respuesta').doc(id).update({
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
      const notificaciones = usuario_likeado.docs[0].data().notificaciones;
if(!notificaciones.includes("noti")){

    
      const doc = usuario_likeado.docs[0];
   


      //mirar bé apartir de aquí

      const id = doc.ref.id; 

          await db.collection('/usuario').doc(id).update({
     
     notificaciones: admin.firestore.FieldValue.arrayUnion("noti")

  })

  }
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

  try{
  const { nombre, uid, token} = req.body

  const decodedToken = await admin.auth().verifyIdToken(token);

  if(decodedToken.uid === uid){
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

}
}
catch(error){
  console.log("Error en bajar_usuario2:"+error);
}  


});

router.post('/bajar_ranking_usuario', async (req, res) => {

  const { numero_likes } = req.body
  const likes = parseInt(numero_likes)

  console.log("numero_likes:",numero_likes);
  console.log("funcion iniciada: bajar_ranking_usuario");

 //  console.log("email:",email);
//  console.log('nombre:',nombre);
  const docRef = db.collection('publicacion_likeada');
 //const docRef2 = db.collection('usuario');

  const snapshot = await docRef.orderBy("num_likeados","desc").startAt(likes).limit(10).get();
  if (snapshot.empty) {
      console.log('No se encontro el usuario.');
      res.send("No se encontro el usuario");
      return;
  } 

  else{



      const datos = snapshot.docs.map(doc => doc.data());

      res.send(datos)

     // const docsData = {};
   //   const fotosPerfil = {};

//datos.forEach(item => {
  //  if (!docsData[item.nombre]) {
    //  docsData[item.nombre] = [];
  // }
 //   docsData[item.nombre].push(item);
   

//});


// Convertir el objeto agrupado en un array de arrays
 //const agrupado = Object.values(docsData);
 //const snapshot_fotos = await docRef2.get();
// Mapeamos las fotos de perfil por nombre
 //snapshot_fotos.forEach(doc => {
  // const data = doc.data();
  // fotosPerfil[data.nombre] = data.foto_perfil; // Asociamos nombre -> foto_perfil
 //});

  
// console.log(fotosPerfil);
  
// Transformar la estructura
 // //const resultado = agrupado.map(grupo => {
  
   //return {
    // publicaciones:grupo,
       //foto_perfil: fotosPerfil[grupo[0].nombre],
     //  nombre: grupo[0].nombre // Obtenemos la foto de perfil
   //};
 //});



 // console.log(resultado);
 //res.send(resultado);
  }

   


});

router.post('/bajar_ranking_usuario_categoria', async (req, res) => {

  const { categoria, numero_likes } = req.body

  const likes = parseInt(numero_likes)
  console.log("funcion iniciada: bajar_ranking_usuario_categoria");

 //  console.log("email:",email);
//  console.log('nombre:',nombre);
  const docRef = db.collection('publicacion_likeada_categoria');
 //const docRef2 = db.collection('usuario');

  const snapshot = await docRef.where('categoria', '==',categoria).orderBy("num_likeados","desc").startAt(likes).limit(10).get();
  if (snapshot.empty) {
      console.log('No se encontro el usuario.');
      res.send("No se encontro el usuario");
      return;
  } 

  else{



      const datos = snapshot.docs.map(doc => doc.data());

      res.send(datos)


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


  try{
    const { email , uid, token} = req.body

 // console.log("email:",email);
   // Verificar el token
  console.log("funcion iniciada: bajar_usuario");
  const decodedToken = await admin.auth().verifyIdToken(token);

  if(decodedToken.uid === uid){
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
     // console.log(doc[0].data());

  //  console.log("la data del tema es:",data)

 // console.log(data);

    res.send(data)


}

  }

  }catch (error) {
    console.error("Error al verificar el token:", error);
    res.status(401).json({ error: 'Token inválido o expirado' });
}
  
   


});

router.post('/comprovar_uid', async (req, res) => {


  try{
    const { uid, token} = req.body

 // console.log("email:",email);
   // Verificar el token
  console.log("funcion iniciada: comprovar_uid");
  const decodedToken = await admin.auth().verifyIdToken(token);

  if(decodedToken.uid === uid){
 res.send("Token valido");

  }

  }catch (error) {
    console.error("Error al verificar el token:", error);
    res.status(401).json({ error: 'Token inválido o expirado' });
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
    res.send("Notificacion eliminada");


   


  }

   


});


router.post('/bajar_notificaciones', async (req, res) => {

  const { nombre, notificaciones } = req.body
//console.log(req.body);
// console.log("nombre:",nombre);

  console.log("funcion iniciada: bajar_notificaciones");
 // const notificaciones2 = Array(notificaciones)
  if(notificaciones.includes('noti')){
 const docRef2 = db.collection('usuario');
    const snapshot_2 = await docRef2.where('nombre', '==', nombre).get();

    
    if(!snapshot_2.empty){
  const doc = snapshot_2.docs[0];
   

    //mirar bé apartir de aquí

    const id = doc.ref.id; 


 //   console.log("la url del tema es:",id)


    await db.collection('/usuario').doc(id).update({
     
      notificaciones:admin.firestore.FieldValue.arrayRemove('noti')
  });

    }
   
  }
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

  const { titulo, comunidad, num_pag, codigo_publicacion} = req.body

 // console.log(req.body);
 
  const numero_pag = parseInt(num_pag)

  const n_pag = 10 * numero_pag + 1;
  const numero = n_pag - 10;
//  console.log("numero final:",n_pag);
 // console.log("numero inicial:",numero);
  //console.log("titulo:",titulo);
 // console.log("comunidad:",comunidad);
  //console.log('titulo:',titulo);
  console.log("funcion iniciada: bajar_comentarios_nuevo");

  const docRef = db.collection('tema_foro');
  const snapshot = await docRef.where('titulo', '==', titulo).where('comunidad', '==', comunidad).where('codigo_publicacion', '==', codigo_publicacion).where("num_serie", "<", n_pag).orderBy('num_serie').startAt(numero).limit(10).get();
  if (snapshot.empty) {
      console.log('No se encontro el tema foro.');
      return;
  } 

  else{

  
 //   const docsData = snapshot.docs.map(doc => 
   //   {
    //  const { comentarios } = doc.data();
    //  return { comentarios }; // Devuelve solo el campo comentario
  //  });
    
    const docsData = snapshot.docs.map(doc => {
      const { comentarios, num_respuestas } = doc.data(); // Obtén solo el campo "comentario"
      if (comentarios) {
        const { fecha_publicacion, usuario, texto, num_serie,  likes, respuestas, codigo_comentario} = comentarios; // Extrae "nombre" y "texto"
        return { fecha_publicacion, usuario, texto, num_serie,  likes, respuestas, codigo_comentario, num_respuestas}; // Devuelve solo estos campos
      }});
    //console.log(docsData);
    res.send(docsData);

  }

   


});


router.post('/subir_token', async (req, res) => {

  const { token, email } = req.body


  console.log("funcion iniciada: subir_token");

  console.log('email:',email);
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

  res.send("Token subido correctamente");
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

  const { titulo1, comunidad, usuario_iniciado, usuario_likeado, num_serie, comentarios, codigo_publicacion} = req.body
  //console.log('titulo:',titulo);
// console.log('comentarios:',comentarios);
  const docRef = db.collection('tema_foro');

  console.log("funcion iniciada: modificar_likes/coment_foro");

  const snapshot = await docRef.where('titulo', '==', titulo1).where('num_serie', '==', num_serie).where('codigo_publicacion', '==', codigo_publicacion).where('comunidad', '==', comunidad).get();
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

 const titulo = "Has recibido un like"

 const texto = "El usuario:"+usuario_iniciado.nombre+" te ha dado un me gusta, en uno de tus comentarios, en el tema del foro:"+titulo1+"de la comunidad:"+comunidad+
 "en el comentario num serie:"+num_serie
  enviarNotificacion(token,titulo,texto)

      const notificaciones = usuario_token.docs[0].data().notificaciones;
if(!notificaciones.includes("noti")){
     

    
      const doc = usuario_token.docs[0];
   


      //mirar bé apartir de aquí

      const id = doc.ref.id; 

          await db.collection('/usuario').doc(id).update({
     
      notificaciones: admin.firestore.FieldValue.arrayUnion("noti")

  })

  }
  
if(!notificaciones.includes("comunidad")){

    
      const doc = usuario_token.docs[0];
   


      //mirar bé apartir de aquí

      const id = doc.ref.id; 

          await db.collection('/usuario').doc(id).update({
     
      notificaciones: admin.firestore.FieldValue.arrayUnion("comunidad")

  })

  }
  
  const usuario_inciado = await docRef_3.where('nombre', '==', usuario_iniciado.nombre).get();
  const nombre_iniciado_nuevo = usuario_inciado.docs[0].data().nombre;
  const foto_perfil_iniciado= usuario_inciado.docs[0].data().foto_perfil;

  const usuario = {
    nombre:nombre_iniciado_nuevo,
    foto_perfil:foto_perfil_iniciado
  }
  const now = admin.firestore.Timestamp.now();

  const expires_at = admin.firestore.Timestamp.fromMillis(now.toMillis() + 6 * 24 * 60 * 60 * 1000);

  const tema_foro_2 = true
  const titulo_comunidad = titulo1
  await db.collection('/Notificaciones').add({
   usuario,
   titulo,
   texto,
   tema_foro_2,
   expires_at,
   comunidad,
   titulo_comunidad
 })



});
 

router.post('/modificar_likes/coment_foro/respuesta', async (req, res) => {


  const { comentarios, codigo_comentario, comunidad, num_serie, usuario_likeado, usuario_iniciado, titulo1} = req.body
//  console.log(req.body);

  //console.log('titulo:',titulo);
// console.log('comentarios:',comentarios);
  const docRef = db.collection('tema_foro_respuestas');

  console.log("funcion iniciada: modificar_likes/coment_foro/respuesta");

  const snapshot = await docRef.where('num_serie', '==', num_serie).where('codigo_comentario', '==', codigo_comentario).where('comunidad', '==', comunidad).get();
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


      await db.collection('/tema_foro_respuestas').doc(id).update({
        comentarios
    })


  }

   
  const tema_foro = snapshot.docs[0].data();

  const docRef_3 = db.collection('usuario');
  const usuario_token = await docRef_3.where('nombre', '==', usuario_likeado.nombre).get();

  const token = usuario_token.docs[0].data().token;

 const titulo = "Has recibido un like"

 const texto = "El usuario:"+usuario_iniciado.nombre+" te ha dado un me gusta, en uno de tus comentarios, en el tema del foro:"+titulo1+"de la comunidad:"+comunidad+
 "en el comentario num serie:"+num_serie
  enviarNotificacion(token,titulo,texto)


  

  const usuario_inciado = await docRef_3.where('nombre', '==', usuario_iniciado.nombre).get();
  const nombre_iniciado_nuevo = usuario_inciado.docs[0].data().nombre;
  const foto_perfil_iniciado= usuario_inciado.docs[0].data().foto_perfil;

  const usuario = {
    nombre:nombre_iniciado_nuevo,
    foto_perfil:foto_perfil_iniciado
  }
  const now = admin.firestore.Timestamp.now();

  const expires_at = admin.firestore.Timestamp.fromMillis(now.toMillis() + 1 * 24 * 60 * 60 * 1000);

  const tema_foro_2 = true
  const titulo_comunidad = titulo1
  await db.collection('/Notificaciones').add({
   usuario,
   titulo,
   texto,
   tema_foro_2,
   expires_at,
   comunidad,
   titulo_comunidad
 })



});  
router.post('/subir_comentario', async (req, res) => {

 // console.log(req.body)

  const { titulo, comentarios, comunidad, creador, codigo_publicacion, num_pag} = req.body
  const num_serie=comentarios.num_serie

  comentarios.codigo_comentario = generarPalabraAleatoria(generarNumeroAleatorio())+generarPalabraAleatoria(generarNumeroAleatorio())+generarPalabraAleatoria(generarNumeroAleatorio())+generarPalabraAleatoria(generarNumeroAleatorio())

  const numero = (num_serie - 1)/10;
  
  if (numero >= num_pag){
    const docRef = db.collection('temas');
    const snapshot = await docRef.where('codigo_publicacion', '==', codigo_publicacion).where('titulo', '==', titulo).get();

    
    const doc = snapshot.docs[0];
   

    //mirar bé apartir de aquí

    const id = doc.ref.id; 

 //   console.log("la url del tema es:",id)


    await db.collection('/temas').doc(id).update({
     
      num_pag:admin.firestore.FieldValue.increment(1)
  })

  }
 // console.log(creador);
  //console.log('titulo:',titulo);
// console.log('comentarios:',comentarios);
const docRef = db.collection('tema_foro');

console.log("funcion iniciada: subir_comentario");

const snapshot = await docRef.where('codigo_publicacion', '==', codigo_publicacion).where('num_serie', '==', num_serie).get();

if(snapshot.empty) {

  const num_respuestas = 0
      await db.collection('/tema_foro').add({
       
        titulo,
        comentarios,
        comunidad,
        creador,
        num_serie,
        codigo_publicacion,
        num_respuestas
    })


  }
}

);

router.post('/subir_comentarios', async (req, res) => {

  //console.log(req)

  const { titulo, comentarios, comunidad, creador, texto, codigo_publicacion, codigo_comentario} = req.body
  console.log("subir_comentarios:",req.body);
  //console.log(creador);
  //console.log('titulo:',titulo);
// console.log('comentarios:',comentarios);
  const docRef = db.collection('tema_foro');

  console.log("funcion iniciada: subir_comentarios");
  comentarios.codigo_comentario = codigo_comentario
  const snapshot = await docRef.where('titulo', '==', titulo).where('comentarios.texto', '==', texto).where('comunidad', '==', comunidad).where('codigo_publicacion', '==', codigo_publicacion).where('comentarios.codigo_comentario', '==', codigo_comentario).get();
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
       
       num_respuestas:admin.firestore.FieldValue.increment(1)
    })

    const num_serie = comentarios.num_serie
    await db.collection('/tema_foro_respuestas').add({
      titulo,
      comentarios,
      comunidad,
      creador,
      num_serie,
      codigo_publicacion,
      codigo_comentario
  })

  }

});
   

router.post('/subir_comentarios_publicacion/respuesta', async (req, res) => {

  

  const {  comentaris ,descripcio, nombre, codigo_comentario, codigo_publicacion} = req.body

  console.log(req.body);
  console.log(comentaris);
  console.log("funcion iniciada: subir_comentarios_publicacion/respuesta");

 // console.log(comentaris);

 
 const num_serie = comentaris.num_serie
  await db.collection('/comentarios_publicacion_respuesta').add({
    comentaris,
    nombre,
    codigo_comentario,
    codigo_publicacion,
    num_serie
})
const docRef = db.collection('comentaris_publicacion');


 const snapshot = await docRef.where('nombre', '==', nombre).where('codigo_publicacion', '==', comentaris.codigo_publicacion).where('codigo_comentario', '==', codigo_comentario).get();
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
      num_respuestas:admin.firestore.FieldValue.increment(1)
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
   

router.post('/subir_comentarios_publicacion/respuesta/comunidad', async (req, res) => {

  

  const {  comentaris , nombre, codigo_comentario, codigo_publicacion} = req.body


 // console.log(req.body);
  console.log("funcion iniciada: subir_comentarios_publicacion/respuesta/comunidad");


 
  const num_serie = comentaris.num_serie
  await db.collection('/comentarios_publicacion_respuesta').add({
    comentaris,
    nombre,
    codigo_comentario,
    codigo_publicacion,
    num_serie
})
 // console.log(comentaris);
 const docRef = db.collection('comentaris_publicacion');

 const snapshot = await docRef.where('nombre', '==', nombre).where('codigo_publicacion', '==', codigo_publicacion).where('codigo_comentario', '==', codigo_comentario).get();
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
      num_respuestas:admin.firestore.FieldValue.increment(1)
   })


  


}
}
);
router.post('/subir_comentarios_publicacion', async (req, res) => {

  

  const {  comentaris, nombre, num_coment, codigo_publicacion} = req.body
 // const codigo_publicacion =  comentaris.codigo_publicacion

  console.log("funcion iniciada: subir_comentarios_publicacion");

 // console.log("nombre:",nombre);
//  console.log(codigo_publicacion);
 // console.log(comentaris);
 const docRef = db.collection('comentaris_publicacion');

 
//console.log("url_publicacion:",url_publicacion);
const hora = admin.firestore.FieldValue.serverTimestamp();


const likes_total = 0;
// const snapshot = await docRef.where('nombre', '==', nombre).where('codigo_publicacion', '==', codigo_publicacion).get();
//if (snapshot.empty) {

const num_respuestas = 0
const codigo_comentario =  generarPalabraAleatoria(generarNumeroAleatorio())+generarPalabraAleatoria(generarNumeroAleatorio())+generarPalabraAleatoria(generarNumeroAleatorio())+generarPalabraAleatoria(generarNumeroAleatorio())
comentaris.codigo_comentario =codigo_comentario
     await db.collection('/comentaris_publicacion').add({
      comentaris,
      nombre,
      codigo_publicacion,
      likes_total,
      hora,
      codigo_comentario,
      num_respuestas
  })

  const docRef2 = db.collection('publicaciones');


     const snapshot2 = await docRef2.where('codigo_publicacion', '==', codigo_publicacion).where('usuario.nombre', '==', nombre).get();
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
          
          num_coment: admin.firestore.FieldValue.increment(1)
       })
      }   

      return;
  


 



   


  


});




router.post('/subir_comentarios_publicacion/comunidad', async (req, res) => {

  

  const {  comentaris ,descripcio, fecha_publicacion, num_serie, nombre, url_publicacion, num_coment, codigo_publicacion} = req.body

  console.log("funcion iniciada: subir_comentarios_publicacion/comunidad");


 // console.log(comentaris);
 const docRef = db.collection('comentaris_publicacion');

 
//console.log("url_publicacion:",url_publicacion);
const hora = admin.firestore.FieldValue.serverTimestamp();


 const snapshot = await docRef.where('nombre', '==', nombre).where('descripcio', '==', descripcio).where('comentaris.texto', '==', comentaris.texto).where('comentaris.num_serie', '==', comentaris.num_serie).get();
 if (snapshot.empty) {

  const codigo_comentario =  generarPalabraAleatoria(generarNumeroAleatorio())+generarPalabraAleatoria(generarNumeroAleatorio())+generarPalabraAleatoria(generarNumeroAleatorio())+generarPalabraAleatoria(generarNumeroAleatorio())

  comentaris.codigo_comentario = codigo_comentario
  const likes_total = 0
  const num_respuestas = 0

     await db.collection('/comentaris_publicacion').add({
      comentaris,
      fecha_publicacion,
      descripcio,
      num_serie,
      nombre,
      codigo_publicacion,
      hora,
      codigo_comentario,
      likes_total,
      num_respuestas
  })
    
  const docRef2 = db.collection('publicaciones_comunidad');


     const snapshot2 = await docRef2.where('codigo_publicacion', '==', codigo_publicacion).where('usuario.nombre', '==', nombre).get();
     if (snapshot2.empty) {
         console.log('No se encontro la publicacion.');
         return;
     } 
   
     else{
   
   
         const doc = snapshot2.docs[0];
      
   
         //mirar bé apartir de aquí
   
         const id = doc.ref.id; 
   
      //   console.log("la url del tema es:",id)
   
   
         await db.collection('/publicaciones_comunidad').doc(id).update({
          
          num_coment
       })
      }   

      return;
  
 } 

 



   


  


});

router.post('/temas', async (req, res) => {
  const {  comunidad , hora} = req.body
  //console.log('descripcio:',descripcio);
      ///  console.log(req.body);
      console.log("funcion iniciada: temas");
     const horaTimestamp = new admin.firestore.Timestamp(
        Math.floor(Number(hora._seconds)),
        Math.floor(Number(hora._nanoseconds))
      );

  const docRef = db.collection('temas');
const snapshot = await docRef.where('comunidad', '==' , comunidad).orderBy('hora','desc').startAt(horaTimestamp).limit(20).get();
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
router.post('/buscador_temas', async (req, res) => {
  const {  comunidad ,texto} = req.body
  //console.log('descripcio:',descripcio);
    //  console.log(req.body);
      console.log("funcion iniciada: buscador_temas");

  const docRef = db.collection('temas');
const snapshot = await docRef .where('comunidad', '==' , comunidad)
.orderBy('titulo') // Es necesario tener un índice en Firestore para 'orderBy'
  .startAt(texto) // Comienza con la cadena que quieres buscar
  .endAt(texto + '\uf8ff').limit(10) // Asegura que incluyas todos los resultados que empiecen con esa cadena
  .get();
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
        const { nombre, email, temas_favoritos } = req.body;
        

        const temas_favoritos2 = JSON.parse(temas_favoritos);

        console.log("funcion iniciada: new-contact");

     const snap = await db.collection('usuario').get();
     const numero_users = snap.size;

        const nombre_base_de_datos = await db.collection('usuario').where('nombre', '==', nombre).get();
        //const telefono_base_de_datos = await db.collection('usuarios').where('telefono', '==', telefono).get();
        const email_base_de_datos = await db.collection('usuario').where('email', '==', email).get();
       // console.log(nombre_base_de_datos);
        //console.log(telefono_base_de_datos);
       // console.log(email_base_de_datos);
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
      //     const codigo_usuario = generarPalabraAleatoria(generarNumeroAleatori())+nombre+generarPalabraAleatoria(generarNumeroAleatorio())+generarPalabraAleatoria(generarNumeroAleatorio())
const logros = ["miembro"];
if (numero_users < 100) {
  logros.push("jeroglifico");
}
if (numero_users < 10000) {
  logros.push("anfora");
}
const notificaciones = ["hola"];
      const num_publicaciones = 0
            await db.collection('usuario').add({
                nombre,
                email,
                temas_favoritos2,
                num_publicaciones,
                logros,
                notificaciones
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

router.post('/comprovar-contact', async (req, res) => {
  try {
      const { nombre, email } = req.body;
      

    

      console.log("funcion iniciada: new-contact");

  
      const nombre_base_de_datos = await db.collection('usuario').where('nombre', '==', nombre).get();
      //const telefono_base_de_datos = await db.collection('usuarios').where('telefono', '==', telefono).get();
      const email_base_de_datos = await db.collection('usuario').where('email', '==', email).get();
     // console.log(nombre_base_de_datos);
      //console.log(telefono_base_de_datos);
     // console.log(email_base_de_datos);
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
  
          res.send('Usuario correcto seguir');
        
          console.log('Usuario correcto seguir');
      }
      
      
     
     
  } catch (error) {
      console.error('Error creando usuario:', error);
      res.status(500).send('Error creando usuario');
  }
});


router.post('/buscar_mensajes_privados', async (req, res) => {
  try {
    

    const { usuario_1, usuario_2 ,uid, token, notificaciones} = req.body;
   //console.log(usuario_1);
    console.log("funcion iniciada:buscar_mensajes_privados ");
  if(notificaciones.includes("mensaje")){

 const docRef2 = db.collection('usuario');
    const snapshot_2 = await docRef2.where('nombre', '==', usuario_1).get();

    
    if(!snapshot_2.empty){
  const doc = snapshot_2.docs[0];
   

    //mirar bé apartir de aquí

    const id = doc.ref.id; 


 //   console.log("la url del tema es:",id)


    await db.collection('/usuario').doc(id).update({
     
      notificaciones:admin.firestore.FieldValue.arrayRemove('mensaje')
  });

    }
   
  }

    const decodedToken = await admin.auth().verifyIdToken(token);

    if(decodedToken.uid === uid){
      const docRef = db.collection('mensaje_final');
    //  const snapshot_usuario_1 = await docRef.where('usuario_1.nombre','==', usuario_1).orderBy('hora','desc').get();
 const snapshot_usuario_1 = await docRef.where('usuario_1.nombre','==', usuario_1).get();
     // const snapshot_usuario_2 = await docRef.where('usuario_2.nombre','==', usuario_2).orderBy('hora','desc').get();
    
    
     const snapshot_usuario_2 = await docRef.where('usuario_2.nombre','==', usuario_2).get();



 const data = snapshot_usuario_1.docs.map(doc => doc.data());

 
 const data_2 = snapshot_usuario_2.docs.map(doc => {
  if (doc.data().usuario_1.nombre != doc.data().usuario_2.nombre) {
    return doc.data();
  }
  return null; // Retorna null para los elementos que no cumplen la condición
}).filter(doc => doc !== null); // Filtra los nulls para que el array final solo tenga los elementos válidos


const resultados = [...data, ...data_2];
 // console.log(resultados);
// Enviar resultados combinados
res.send(resultados);

   
      
         
    
    }
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
   
     const notificaciones = usuario_token.docs[0].data().notificaciones;
if(!notificaciones.includes("noti")){

    
      const doc = usuario_token.docs[0];
   


      //mirar bé apartir de aquí

      const id = doc.ref.id; 

          await db.collection('/usuario').doc(id).update({
     
      notificaciones: admin.firestore.FieldValue.arrayUnion("noti")

  })

  }
  
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

     const notificaciones = usuario_token.docs[0].data().notificaciones;
if(!notificaciones.includes("noti")){
    

    
      const doc = usuario_token.docs[0];
   


      //mirar bé apartir de aquí

      const id = doc.ref.id; 

          await db.collection('/usuario').doc(id).update({
     
      notificaciones: admin.firestore.FieldValue.arrayUnion("noti")

  })

  }
  
if(!notificaciones.includes("home")){

    
      const doc = usuario_token.docs[0];
   


      //mirar bé apartir de aquí

      const id = doc.ref.id; 

          await db.collection('/usuario').doc(id).update({
     
      notificaciones: admin.firestore.FieldValue.arrayUnion("home")

  })

  }
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
    const { usuario_1, usuario_2, hora, codigo_chat} = req.body;
   //console.log(usuario_1);
    console.log("funcion iniciada:bajar_chat_usuarios ");

    // amb el 5 soc el ser mes felic del mon guanyo 1000€ mes amb la aplicacio i  aixo es good +  1500 de merda treballant despres un altre app + 1000 = 2000 + 1500 = 3500 € mes 
   // console.log(req.body);
   const codigo = await Recibir_codigo_chat(codigo_chat,usuario_1.nombre,usuario_2.nombre)

   const horaTimestamp = new admin.firestore.Timestamp(
     Math.floor(Number(hora._seconds)),
     Math.floor(Number(hora._nanoseconds))
   );
 //   console.log("codigo_chat viva franco:",codigo);
 
    const docRef = db.collection('mensajes_privados');
   // const snapshot = await docRef.where('descripcio', '==', descripcio).get();
  
    const snapshot = await docRef.where('codigo_chat','==', codigo).orderBy('hora','desc').startAfter(horaTimestamp).limit(10).get();

 

    if(!snapshot.empty){
      const docsData = snapshot.docs.map(doc => doc.data());

      res.send(docsData)
    }
    else{
      res.send("No hay ningun chat");
    }

   // if(usuario_1.nombre !== usuario_2.nombre){
     // const docRef = db.collection('mensajes_privados');
      //const snapshot_usuario_1 = await docRef.where('usuario_1.nombre','==', usuario_1.nombre).where('usuario_2.nombre','==', usuario_2.nombre).get();

      //onst snapshot_usuario_2 = await docRef.where('usuario_1.nombre','==', usuario_2.nombre).where('usuario_2.nombre','==', usuario_1.nombre).get();
      //const data = snapshot_usuario_1.docs.map(doc => doc.data());
      //const data_2 = snapshot_usuario_2.docs.map(doc => doc.data());

    //  const resultados = [...data, ...data_2];


    //    res.send(resultados);

  
   // }
    //else{
    //  const docRef = db.collection('mensajes_privados');
    //  const snapshot_usuario_1 = await docRef.where('usuario_1.nombre','==', usuario_1.nombre).where('usuario_2.nombre','==', usuario_2.nombre).get();

      
 //const data = snapshot_usuario_1.docs.map(doc => doc.data());


//const resultados = [data];


//res.send(data);

   // }
      

    
     
  } catch (error) {
      console.error('Error buscando mensajes:', error);
      res.status(500).send('Error buscando mensajes');
  }
});




router.post('/subir_chat_usuarios', async (req, res) => {
  try {
    
    const { usuario_1, usuario_2,mensaje} = req.body;
  
   console.log("funcion iniciado: subir_chat_usuarios");
   // console.log("Usuario_2:",usuario_2)


   const fecha_publicacion = mensaje.fecha_envio

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
      mensaje_final,
      fecha_publicacion
  })
  res.send("mensaje_enviado");

  return;
}
  else if(!snapshot_usuario_2.empty){
    const doc = snapshot_usuario_2.docs[0];

    const id = doc.ref.id; 
   
    const mensaje_final = mensaje.texto

  
  
        await db.collection('/mensaje_final').doc(id).update({
          mensaje_final,
          fecha_publicacion
      });
      res.send("mensaje_enviado");

      return;
  }

 else if(!snapshot_usuario_1.empty){
    const doc = snapshot_usuario_1.docs[0];

    const id = doc.ref.id; 
   
    const mensaje_final = mensaje.texto

  
  
        await db.collection('/mensaje_final').doc(id).update({
          mensaje_final,
          fecha_publicacion
      });

      res.send("mensaje_enviado");
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
