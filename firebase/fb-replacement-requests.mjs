import { collection, addDoc, getDocs } from 'firebase/firestore/lite';
import { fb_db } from "./fb-initializer.mjs";
import constants from "../constants.js";

// Create a new car replacement request to firebase
// Data is an object with the following properties:
// - audio: string (url)
// - transcription: string
// - replacement: string
// - brand: string
// - model: string
// - year: string
// - chat_id: string
// - country: string
// - city: string
// - created_at: timestamp
// - updated_at: timestamp
// - status: string
export async function createReplacementRequest(data) {
  console.log("Creating replacement request: ", data);
  try {
    data.created_at = new Date();
    data.updated_at = new Date();
    data.status = constants.request_status.NEW;

    const docRef = await addDoc(collection(fb_db, "replacement-requests"), data);
    return docRef.id;
  } catch (e) {
    console.error("Error saving request: ", e);
  }
}
