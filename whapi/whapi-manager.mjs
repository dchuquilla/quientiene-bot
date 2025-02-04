
import fetch from "node-fetch";
import { config } from "../config.mjs";
import { createRequestPayload, transcribeAudio } from "../openai/openai-api.mjs";
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

export const generateRandomString = (length) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
};

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
  const json = await response.json();
  console.log('Whapi response:', JSON.stringify(json, null, 2));
  return json;
}

export async function handleNewMessages(req, res){ // handle messages
  try {
    /** type {import('./whapi').Message[]} */
    const messages = req?.body?.messages;
    for (let message of messages) {
      if (message.from_me) continue; // Skip messages from the bot
      if (message.from !== "593992620889") continue; // Only respond to messages from this number

      /** type {import('./whapi').Sender} */
      const sender = {
        to: message.chat_id
      }

      // Local scope variables
      let endpoint = 'messages/text';
      let audio_link = ""
      let transcription_text = "";
      let payload = null;

      console.log('Message:', message);
      // Handle message type
      if (["audio", "voice"].includes(message["type"])) { // if message is audio or voice
        sender.body = '🔊 Recibí tu mensaje de voz, por favor espera un momento mientras lo transcribo.';
        sendWhapiRequest(endpoint, sender); // send request
        if (message["type"] === "voice") { // if message is voice
          audio_link = message.voice?.link
          transcription_text = await transcribeAudio(audio_link, message.voice?.id);
        } else { // if message is audio
          audio_link = message.audio?.link
          transcription_text = await transcribeAudio(audio_link, message.audio?.id);
        }
        payload = await createRequestPayload(transcription_text)
      } else if (message["type"] === "text") { // if message is text
        transcription_text = message.text?.body?.trim();
        payload = await createRequestPayload(transcription_text);
      } else if (message["type"] === "reply" && message.reply.type === "buttons_reply") { // if message is a reply
        console.log('Reply:', message.reply);
        const reply_id = message.reply.buttons_reply.id.split(':');
        console.log('Reply type:', reply_id[2]);

        if (reply_id[2] === "chasis") {
          sender.body = '🔍 Por favor ingresa los 6 primeros dígitos del número de chasis del vehículo.';
        } else if (reply_id[2] === "picture") {
          sender.body = '📸 Por favor envía una fotografía de la parte del vehículo que estás buscando.';
        } else {
          sender.body = '😔 No se reconoce una solicitud de repuesto en tu mensaje, por favor intenta nuevamente';
        }
        console.log('sender:', sender);
        await sendWhapiRequest(endpoint, sender); // send request
        continue;
      } else { // if message is not audio, voice or text
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
      // Handle payload to respond
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
          const detailsKey = generateRandomString(6);
          const data = {
            audio: audio_link,
            transcription: transcription_text,
            replacement: payload.request.replacement,
            brand: payload.request.brand,
            model: payload.request.model,
            year: payload.request.year,
            chat_id: message.chat_id,
            phone: `+${message.from}`,
            details_key: detailsKey,
            country: 'Ecuador',
            city: 'Quito'
          }

          // Create replacement request and serve to firebase
          const replacement_request_id = await createReplacementRequest(data);
          const seatchResults = await searchReplacements(payload.request);

          // Send response with interactive buttons
          // endpoint = 'messages/interactive';
          // sender.type = 'button';
          // sender.header = {text: `🚗 Solicitud de repuesto No. *${replacement_request_id}*`};
          // sender.body = {text: '🙋 Solicitud recibida, estamos buscando el repuesto para ti.'};
          // sender.footer = {text: '✅ Revisa el estado de tu solicitud en el siguiente enlace:'};
          // sender.action = {buttons: [
          //   {
          //     type: 'url',
          //     title: '📸 Ver mi solicitud',
          //     id: `${replacement_request_id}:url`,
          //     url: `${config.platformUrl}/replacement-requests/${replacement_request_id}`
          //   }
          // ]}

          console.log('Search results:', seatchResults);

          sender.body = '🙋 Solicitud recibida, estamos buscando el repuesto para ti. Revisa el estado de tu solicitud en el siguiente enlace ' + `${config.platformUrl}/replacement-requests/${replacement_request_id}?detailsKey=${detailsKey}`;

          break;
        }
      }

      // Send response
      await sendWhapiRequest(endpoint, sender); // send request
    }
    res.send('Ok');
  } catch (e) {
    res.send(e.message);
  }
}
