// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, getDocs, getDoc, doc, query, where } from 'firebase/firestore';
import { config } from "../config.mjs";
import { sendWhapiRequest } from "../whapi/whapi-manager.mjs";
import vcard from 'vcard-generator';

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
    snapshot.docChanges().forEach(async (change) => {
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
        console.log("Modified document ID: ", change.doc.id);
        const data = change.doc.data();
        // TODO sent approve notifications
        switch (collectionName) {
          case "replacement-proposals":
            if (data.status !== "approved") {
              break;
            }
            const endpoint = 'messages/text';
            const replacementProposal = data;
            const store = await GetDocumentsByField("stores", "email", replacementProposal.store_id);
            const replacementRequest = await getReplacementRequest(replacementProposal.request_id);
            const sender = {};
            const ownerVCard = vcard.generate({
              name: {
                familyName: 'Propietario',
                givenName: 'Vehculo',
              },
              formattedNames: [{
                text: 'Propietario de veiculo',
              }],
              nicknames: [{
                text: 'QuienTiene.com',
              }],
              phones: [{
                type: 'work',
                text: replacementRequest.phone,
              }, {
                text: replacementRequest.phone,
              }, {
                uri: `tel:${replacementRequest.phone}`,
              }],
              urls: [{
                type: 'Solicitud',
                uri: `${config.platformUrl}/replacement-requests/${replacementRequest.id}`,
              }],
              notes: [{
                text: replacementRequest.transcription,
              }],
            });

            // Send response with interactive buttons
            sender.to = `${store[0].phone}@s.whatsapp.net`;
            sender.body = `🙋 Su cotización fue aceptada, ${config.platformUrl}/replacement-proposals/${change.doc.id}`;

            console.log("Sending message to store: ", sender);
            await sendWhapiRequest(endpoint, sender);

            const c_endpoint = '/messages/contact';
            const c_sender = {
              to: `${store.phone}@s.whatsapp.net`,
              name: "Propietario vehículo",
              vcard: ownerVCard,
              body: "Información de contacto."
            }
            await sendWhapiRequest(c_endpoint, c_sender);
            break;
          case "replacement-requests":
            console.log("Replacement request modified: ", change.doc.data());
            break;
          default:
            break;
        }
      }
      if (change.type === "removed") {
        console.log("Removed document: ", change.doc.data());
      }
    });
  });
};

export const getReplacementRequest = async (id) => {
  const replacementRequestsCollection = collection(fb_db, "replacement-requests");
  const singleReplacementRequest = doc(replacementRequestsCollection, id);
  const response = await getDoc(singleReplacementRequest);
  const data = response.data();
  console.log('Replacement request:', data);
  return data;
}

export const GetDocumentsByField = async (collectionName, fieldName, value) => {
  try {
    const collectionRef = collection(fb_db, collectionName);
    let q;
    if (Array.isArray(value)) {
      q = query(collectionRef, where(fieldName, "in", value));
    } else {
      q = query(collectionRef, where(fieldName, "==", value));
    }
    const querySnapshot = await getDocs(q);
    const documents = querySnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
    console.log(`documents from ${collectionName}: ${JSON.stringify(documents)}`);
    return documents;
  } catch (error) {
    console.error(`Error in GetDocumentsByField: ${error}`);
    return [];
  }
};
