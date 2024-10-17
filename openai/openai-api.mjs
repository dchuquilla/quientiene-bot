import fs from "fs";
import OpenAI from "openai";
import axios from "axios";

const openai = new OpenAI();

export async function transcribeAudio(url, audio_id) {
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

export async function create_payload(text) {
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
