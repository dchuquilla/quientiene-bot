import { sendWhapiRequest } from "../whapi/whapi-manager.mjs";
import { setupSnapshotListener } from "../firebase/fb-initializer.mjs";

export default function StoresListener() {
  return setupSnapshotListener("stores", async (store) => {
  // send message to the phone phone in store object
  const endpoint = 'messages/text';
  const phone = store.phone.replace(/\D/g, ''); // Remove non-numeric characters
  const sender = {
    to: `${phone}@s.whatsapp.net`,
    body: `😊 La cuenta de *${store.name}* fue creada con éxito.\nsu ID de almacen es: *${store.id}*`,
  }
  sender.body
  // eslint-disable-next-line
  await sendWhapiRequest(endpoint, sender);
});
}
