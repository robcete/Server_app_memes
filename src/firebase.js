require("dotenv").config();

const { getFirestore } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
var admin = require("firebase-admin");

var serviceAccount = require("./../firebase.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket:"gs://red-social-memes.appspot.com"
});

const db = getFirestore();

module.exports = {
  db, admin
};
