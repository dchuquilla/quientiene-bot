// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, getDocs } from 'firebase/firestore';
import { config } from "../config.mjs";

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

export const allStores = async () => {
  const storesCollection = collection(fb_db, "stores");
  const storesSnapshot = await getDocs(storesCollection);
  return storesSnapshot.docs.map(doc => doc.data());
}

export const setupSnapshotListener = (collectionName, callback) => {
  const collectionRef = collection(fb_db, collectionName);
  return onSnapshot(collectionRef, (snapshot) => {
    console.log(`Received snapshot from ${collectionName}`);
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const docData = change.doc.data();
        const now = new Date();
        const docTimestamp = docData.created_at ? docData.created_at.toDate() : now;
        if (docTimestamp > now.setMinutes(now.getMinutes() - 2)) { // Adjust the time window as needed
          console.log("Added document: ", change.doc.id);
          callback({"id": change.doc.id, ...docData});
        }
      }
      if (change.type === "modified") {
        console.log("Modified store: ", change.doc.data());
      }
      if (change.type === "removed") {
        console.log("Removed store: ", change.doc.data());
      }
    });
  });
};
