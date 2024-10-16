import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import fetch from "node-fetch";
import FormData from "form-data";
import OpenAI from "openai";
import config from "./config.js";
import axios from "axios";

const openai = new OpenAI();

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

/**
 * Send request to Whapi.Cloud
 * @param endpoint - endpoint path
 * @param params - request body
 * @param method - GET, POST, PATCH, DELETE
 * @returns {Promise<object>}
 */
async function sendWhapiRequest(endpoint, params= {}, method = 'POST') { // send request to endpoint with params, with POST by default
  let options = {
    method: method,
    headers: {
      Authorization: `Bearer ${config.token}`
    },
  };
  if (!params.media) options.headers['Content-Type'] = 'application/json'; // if in params media is null - set json in headers
  let url = `${config.apiUrl}/${endpoint}`;
  if(params && Object.keys(params).length > 0) {
    if(method === 'GET')
      url += '?' + new URLSearchParams(params); // if GET method set in params, then params move to query
    else
      options.body = params?.media ? toFormData(params) : JSON.stringify(params); // if in params media - transform to formData, else - json
  }
  const response = await fetch(url, options); // send request
  let json = await response.json();
  console.log('Whapi response:', JSON.stringify(json, null, 2));
  return json;
}

/**
 * Convert object to FormData
 * @param obj
 * @returns {FormData}
 */
function toFormData(obj) {
  const form = new FormData();
  for (let key in obj) {
    form.append(key, obj[key]);
  }
  return form;
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

async function handleNewMessages(req, res){ // handle messages
  try {
    /** type {import('./whapi').Message[]} */
    const messages = req?.body?.messages;
    for (let message of messages) {
      if (message.from_me) continue;
      /** type {import('./whapi').Sender} */
      const sender = {
        to: message.chat_id
      }
      let endpoint = 'messages/text';

      console.log('Message:', message);
      if (["audio", "voice"].includes(message["type"])) {
        // TODO: Sent audio to openAI to process replacement request.
        // For now, just send a text message.

        sender.body = '🧑‍💼 Recibimos tu audio, lo estamos procesando...\n';
        if (message["type"] === "voice") {
          transcribeAudio(message["voice"]["link"], message["voice"]["id"]);
        } else {
          transcribeAudio(message["audio"]["link"], message["audio"]["id"]);
        }
      } else if (message["type"] === "text") {
        const text = message.text?.body?.trim();
        console.log("Processing Text: ", text)
        const payload = await create_payload(text);
        console.log("Payload 2: ", payload)

        switch (payload.message) {
          case "greeting": {
            sender.body = '👋 Hola buen día.\n\n' +
              '🧑‍🔧 Por favor dime que repuesto estás buscando!  \n\n' +
              '🚗 Recuerda mencionar marca, modelo y año del vehículo. \n\n' +
              '🗣️/💬 Puedes enviar audios o textos.';
            break;
          }
          case "not_replacement_request": {
            sender.body = '😔 No se reconoce una solicitud de repuesto en tu mensaje, por favor intenta nuevamente';
            break;
          }
          case "error_create_payload": {
            sender.body = '😔 Ocurrió un error, por favor intenta nuevamente.'
            break;
          }
          default: {
            sender.body = 'Solicitud recibida, estamos buscando el repuesto para ti. Por favor espera mientras la red de proveedores preparan una cotización...';
          }
        }

      } else {
        // let command = Object.keys(COMMANDS)[message.text?.body?.trim() - 1];
        // command = command || message.text?.body?.toUpperCase();

        // console.log('Command: ', command);

        // switch (command) { // depending on the command, perform an action
          // case 'TEXT': {
          //   sender.body = 'Simple text message';
          //   break;
          // }
          // case 'IMAGE': {
          //   sender.caption = 'Text under the photo.';
          //   sender.media = fs.createReadStream(FILES.IMAGE); // read file
          //   endpoint = 'messages/image';
          //   break;
          // }
          // case 'DOCUMENT': {
          //   sender.caption = 'Text under the document.';
          //   sender.media = fs.createReadStream(FILES.DOCUMENT);
          //   endpoint = 'messages/document';
          //   break;
          // }
          // case 'VIDEO': {
          //   sender.caption = 'Text under the video.';
          //   sender.media = fs.createReadStream(FILES.VIDEO);
          //   endpoint = 'messages/video';
          //   break;
          // }
          // case 'CONTACT': {
          //   sender.name = 'Whapi Test';
          //   sender.vcard = fs.readFileSync(FILES.VCARD).toString();
          //   endpoint = 'messages/contact';
          //   break;
          // }
          // case 'PRODUCT': {
          //   /* you can get real product id using endpoint  https://whapi.readme.io/reference/getproducts */
          //   endpoint = `business/products/${config.product}`;
          //   break;
          // }
          // case 'GROUP_CREATE': {
          //   /* Warning : you can create group only with contacts from phone contact list */
          //   const res = await sendWhapiRequest(`groups`, {subject: 'Whapi.Cloud Test', participants: [message.chat_id.split('@')[0]]});
          //   sender.body = res.group_id ? `Group created. Group id: ${res.group_id}` : 'Error';
          //   break;
          // }
          // case 'GROUP_TEXT': {
          //   /*To get group id, use /groups endpoint */
          //   sender.to = config.group;
          //   sender.body = 'Simple text message for the group';
          //   break;
          // }
          // case 'GROUPS_IDS': { // get groups
          //   const {groups} = await sendWhapiRequest('groups', {count: 3}, 'GET');
          //   sender.body = groups && groups.reduce((prevVal, currVal, i) => {
          //     return i === 0 ? `${currVal.id} - ${currVal.name}` : prevVal + ',\n ' + `${currVal.id} - ${currVal.name}`;
          //   }, '') || 'No groups';
          //   break;
          // }
          // default: {  // if command not found - set text message with commands
          //   sender.body = '👋 Hola buen día.\n\n' +
          //     '🧑‍🔧 Por favor dime que repuesto estás buscando!  \n\n' +
          //     '🚗 Recuerda mencionar marca, modelo y año del vehículo. \n\n' +
          //     '🗣️/💬 Puedes enviar audios o textos.';
          // }
        // }
        continue;
      }

      await sendWhapiRequest(endpoint, sender); // send request
    }
    res.send('Ok');
  } catch (e) {
    res.send(e.message);
  }
}

// Create a new instance of express
const app = express();
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.send('Bot is running');
});

app.post('/hook/messages', handleNewMessages); // route for get messages

setHook().then(() => {
  const port = config.port || (config.botUrl.indexOf('https:') === 0 ? 443 : 80) // if port not set - set port 443 (if https) or 80 (if http)
  app.listen(port, function () {
    console.log(`Listening on port ${port}...`);
  });
});

async function transcribeAudio(url, audio_id) {
  console.log("transcribing audio")
  const filePath = `./files/${audio_id}.ogg`;

  // Download the file
  const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
  });

  // Save the file locally
  const writer = fs.createWriteStream(filePath);
  response.data.pipe(writer);

  // Wait for the file to be fully written
  await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
  });

  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: "whisper-1",
  });

  console.log(transcription.text);

  create_payload(transcription.text)
}

async function create_payload(text) {
  console.log("creating payload")
  try {
    const payload = await new Promise((resolve, reject) => {
      openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Eres un experto en JSON. Por favor crea un objeto JSON siguiendo estas reglas" },
        { role: "system", content: "ESTRUCTURA: {\"request\": { \"replacement\": \"string\", \"brand\": \"string\", \"model\": \"string\", \"year\": \"string\" }}." },
        { role: "system", content: "SALUDO: Cuando el texto sea un saludo sin informacion de alguna solicitud, responde con {\"message\": \"greeting\"}" },
        { role: "system", content: "EXCEPTION: Cuando el texto no sea un saludo o una solicitud de repuesto, responde con {\"message\": \"not_replacement_request\"}" },
        {
        role: "user",
        content: text,
        },
      ],
      }).then(resolve).catch(reject);
    });
    console.log("Payload 1: ", payload.choices[0].message.content)
    return JSON.parse(payload.choices[0].message.content);
  } catch (error) {
    console.log("Error: ", error)
    return { message: "error_create_payload" }
  }
}
