import express from "express";
import bodyParser from "body-parser";
import config from "./config.js";
import { sendWhapiRequest, handleNewMessages } from "./whapi/whapi-manager.mjs";
import StoresListener from "./listeners/stores-listener.mjs";

process.on('unhandledRejection', err => {
  console.log(err)
});

const COMMANDS = {  // bot commands
  TEXT: 'Simple text message',
  IMAGE: 'Send image',
  DOCUMENT: 'Send document',
  VIDEO: 'Send video',
  CONTACT: 'Send contact',
  PRODUCT: 'Send product',
  GROUP_CREATE: 'Create group',
  GROUP_TEXT: 'Simple text message for the group',
  GROUPS_IDS: 'Get the id\'s of your three groups',
  INICIAR: 'Iniciar conversación'
}

const FILES = { // file path
  IMAGE: './files/file_example_JPG_100kB.jpg',
  DOCUMENT: './files/file-example_PDF_500_kB.pdf',
  AUDIO: './files/replacement-request.ogg',
  VIDEO: './files/file_example_MP4_480_1_5MG.mp4',
  VCARD: './files/sample-vcard.txt'
}

async function setHook() {  // request for set hook and recieve messages
  if (config.botUrl) {
    /** type {import('./whapi').Settings} */
    const settings = {
      webhooks: [
        {
          url: config.botUrl,
          events: [
            // default event for getting messages
            {type: "messages", method: "post"}
          ],
          mode: "method"
        }
      ]
    }
    await sendWhapiRequest('settings', settings, 'PATCH');
  }
}

// Create a new instance of express
const app = express();
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.send('Bot is running');
});

app.get('/owner/:owner_id/request/:id', (req, res) => {
  res.send('Owner id: ' + req.params.owner_id + " | " + 'Request id: ' + req.params.id);
});

app.post('/hook/messages', handleNewMessages); // route for get messages

setHook().then(() => {
  const port = config.port || (config.botUrl.indexOf('https:') === 0 ? 443 : 80) // if port not set - set port 443 (if https) or 80 (if http)
  app.listen(port, function () {
    // Enable firestore listeners
    StoresListener();
    console.log(`Listening on port ${port}...`);
  });
});
