import fs from "fs";
import OpenAI from "openai";
import axios from "axios";

const openai = new OpenAI();

export async function transcribeAudio(url, audio_id) {
  console.log("Transcribing audio: ", url, audio_id)
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

  // Send audio to OpenAI and transcribe
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: "whisper-1",
  });

  console.log("Transcription: ", transcription.text)
  return transcription.text;
}

export async function createRequestPayload(text) {
  console.log("Creating payload for text: ", text)
  try {
    const payload = await new Promise((resolve, reject) => {
      openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Eres un experto en JSON. Por favor crea un objeto JSON siguiendo estas reglas" },
        { role: "system", content: "ESTRUCTURA: {\"message\": \"accepted\",\"request\": { \"replacement\": \"string\", \"brand\": \"string\", \"model\": \"string\", \"year\": \"string\" }}." },
        { role: "system", content: "SALUDO: Cuando el texto sea un saludo sin informacion de alguna solicitud, responde con {\"message\": \"greeting\"}" },
        { role: "system", content: "EXCEPTION: Cuando el texto no sea un saludo o una solicitud de repuesto, responde con {\"message\": \"not_replacement_request\"}" },
        {
        role: "user",
        content: text,
        },
      ],
      }).then(resolve).catch(reject);
    });
    const requestPayload = JSON.parse(payload.choices[0].message.content);
    return requestPayload
  } catch (error) {
    console.log("Error: ", error)
    return { message: "error_create_payload" }
  }
}

export async function searchReplacements(request) {
  // Create query with OpenAI
  const prompt = `Busca repuestos de autos en Quito, Ecuador.
                  Repuesto: ${request.replacement}, Marca: ${request.brand}, Modelo: ${request.model}, Año: ${request.year}.
                  Formato de salida: nombre, descripción, precio, empresa, URL.`;
  const openaiResponse = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt,
    max_tokens: 50,
  });

  const query = openaiResponse.data.choices[0].text.trim();

  // Use Google Custom Search API
  const googleResponse = await axios.get(
    `https://www.googleapis.com/customsearch/v1`,
    {
      params: {
        key: process.env.GOOGLE_API_KEY,
        cx: process.env.SEARCH_ENGINE_ID,
        q: query,
      },
    }
  );

  // Process results
  const results = googleResponse.data.items.map((item) => ({
    nombre: item.title,
    descripcion: item.snippet,
    url: item.link,
  }));

  return res.json({
    mensaje: 'Resultados encontrados:',
    resultados: results,
  });
}
