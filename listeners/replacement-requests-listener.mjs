import { sendWhapiRequest } from "../whapi/whapi-manager.mjs";
import { setupSnapshotListener, allStores } from "../firebase/fb-initializer.mjs";
import { config } from "../config.mjs";

export default function ReplacementRequestsListener() {
  return setupSnapshotListener("replacement-requests", async (replacementRequest) => {
    console.log("New replacement request: ", replacementRequest);
    const endpoint = 'messages/text';
    const stores = await allStores();
    const sender = {};

    for (let store of stores) {
      // send message to the phone phone in store object
      const phone = store.phone.replace(/\D/g, ''); // Remove non-numeric characters

      // Send response with interactive buttons
      sender.to = `${phone}@s.whatsapp.net`;
      sender.body = `🙋 Ha recibido una nueva solicitud de repuesto, ${config.platformUrl}/replacement-requests/${replacementRequest.id}`;

      console.log("Sending message to store: ", sender);
      await sendWhapiRequest(endpoint, sender);
    }
  });
}
