import fs from "fs";
import OpenAI from "openai";
import axios from "axios";

const openai = new OpenAI();

async function main() {
  const url = "https://s3.eu-central-1.wasabisys.com/in-files/593961674787/oga-2c3e84613cf88cf785042bbc68ff06cf-80908a4cb81b59.oga";
  const filePath = "./files/wh-replacement-request.ogg";

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

  console.log(transcription);
}
main();
