// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore/lite';
import config from "../config.js";
import constants from "../constants.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: config.fb_apiKey,
  authDomain: config.fb_authDomain,
  databaseURL: config.fb_databaseURL,
  projectId: config.fb_projectId,
  storageBucket: config.fb_storageBucket,
  messagingSenderId: config.fb_messagingSenderId,
  appId: config.fb_appId
};

// Initialize Firebase
export const fb_app = initializeApp(firebaseConfig);
export const fb_db = getFirestore(fb_app);
