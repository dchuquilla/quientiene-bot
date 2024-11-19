import { sendWhapiRequest } from "../whapi/whapi-manager.mjs";
import { setupSnapshotListener, getReplacementRequest } from "../firebase/fb-initializer.mjs";
import { config } from "../config.mjs";

export default function ReplacementProposalsListener() {
  return setupSnapshotListener("replacement-proposals", async (replacementProposal) => {
    console.log("New replacement proposal: ", replacementProposal);
    const endpoint = 'messages/text';
    const replacementRequest = await getReplacementRequest(replacementProposal.request_id);
    const sender = {};

    // Send response with interactive buttons
    sender.to = replacementRequest.chat_id;
    sender.body = `🙋 Ha recibido una nueva cotización, ${config.platformUrl}/replacement-proposals/${replacementProposal.id}?approve_key=${replacementProposal.approve_key}`;

    console.log("Sending message to store: ", sender);
    await sendWhapiRequest(endpoint, sender);
  });
}
