
import fetch from "node-fetch";
import config from "../config.js";
import { create_payload, transcribeAudio } from "../openai/openai-api.mjs";
import { createReplacementRequest } from "../firebase/fb-replacement-requests.mjs";

/**
 * Send request to Whapi.Cloud
 * @param endpoint - endpoint path
 * @param params - request body
 * @param method - GET, POST, PATCH, DELETE
 * @returns {Promise<object>}
 */

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

export async function sendWhapiRequest(endpoint, params= {}, method = 'POST') { // send request to endpoint with params, with POST by default
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

export async function handleNewMessages(req, res){ // handle messages
  try {
    /** type {import('./whapi').Message[]} */
    const messages = req?.body?.messages;
    for (let message of messages) {
      if (message.from_me) continue;
      if (message.from !== "593992620889") continue;
      /** type {import('./whapi').Sender} */
      const sender = {
        to: message.chat_id
      }
      let endpoint = 'messages/text';
      let audio_link = ""
      let transcription_text = "";

      console.log('Message:', message);
      let payload = null;
      if (["audio", "voice"].includes(message["type"])) {
        sender.body = '🧑‍💼 Recibimos tu audio, lo estamos procesando...\n';
        if (message["type"] === "voice") {
          audio_link = message.voice?.link
          transcription_text = await transcribeAudio(audio_link, message.voice?.id);
        } else {
          audio_link = message.audio?.link
          transcription_text = await transcribeAudio(audio_link, message.audio?.id);
        }
        payload = await create_payload(transcription_text)
      } else if (message["type"] === "text") {
        transcription_text = message.text?.body?.trim();
        payload = await create_payload(transcription_text);
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
      console.log('Payload:', payload);
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
          console.log('Error creating payload for message:', {"chat_id": message.chat_id ,"text": text});
          break;
        }
        case "accepted": {
          sender.body = '🙋 Solicitud recibida, estamos buscando el repuesto para ti. Por favor espera mientras la red de proveedores prepara las cotizaciones...';
          const data = {
            audio: audio_link,
            transcription: transcription_text,
            replacement: payload.request.replacement,
            brand: payload.request.brand,
            model: payload.request.model,
            year: payload.request.year,
            chat_id: message.chat_id,
            country: 'Ecuador',
            city: 'Quito'
          }
          await createReplacementRequest(data);
        }
      }

      await sendWhapiRequest(endpoint, sender); // send request
    }
    res.send('Ok');
  } catch (e) {
    res.send(e.message);
  }
}
