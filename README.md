# WhatsApp NodeJS Bot (Whapi.Cloud WhatsApp API)
# WhatsApp Chatbot

This example of the WhatsApp bot implementation covers the most frequently used functionalities: sending messages, voice and audio messages, it also implements
openAI chat gpt integration to interact with the user.

## Features

In the source code of the bot, you will find the following functionalities:
- Receive and read  regular text messages
- Receive and read  voice and audio messages
- Respond to unfamiliar commands, which could be instructions or welcome messages

## Setup Instructions

### Step-by-step instructions on how to set up and run this chatbot: [Setting up Chatbot WhatsApp Node.js](https://whapi.cloud/setting-up-chatbot-whatsapp-nodejs)

We'll talk in detail about how to test the bot locally, which servers to use, some tips, and the main causes of popular failures.

## Example `.env` File

```env
OPENAI_API_KEY=your-openai-api-key
```

## Example `config.js` File

```javascript
module.exports = {
  // API endpoint URL
  apiUrl: "https://gate.whapi.cloud/",
  // API token from your channel
  token: "YOUR-CHANNEL-TOKEN",
  // The ID of the group to which we will send the message. Use to find out the ID: https://whapi.readme.io/reference/getgroups
  group: '120363166759645996033@g.us',
  // The ID of the product we will send for the example. Create a product in your WhatsApp and find out the product ID: https://whapi.readme.io/reference/getproducts
  product: '6559353560856703',
  // Bot`s URL (for static file). Webhook Link to your server. At ( {server link}/hook ), when POST is requested, processing occurs
  botUrl: "https://y0ur-ngr0k-url.ngrok-free.app/hook",
  // Bot's Port (for hook handler). Don't use 443 port.
  port: "8081"
}
```

You can modify these configurations according to your requirements.

## Running Locally

To run the project locally, follow these steps:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory and add your configurations as shown in the example above.

3. Create the same `OPENAI_API_KEY` in your environment variables.

4. Create a `config.js` file in the root directory and add your configurations as shown in the example above.

5. Run the tests:
   ```bash
   npm test
   ```

This will execute the tests and ensure that your setup is correct.
