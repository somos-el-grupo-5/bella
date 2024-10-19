const QRCode = require('qrcode');
const { MessageMedia } = require('whatsapp-web.js');

const { callChatGPT } = require('./openaiClient');
const dataStore = require('./dataStore');
const { isFinishingLine } = require('./utils');
const { processImage } = require('./imageProcessor');

function initialize(client) {
  client.on('qr', (qr) => {
    QRCode.toFile('qr-code.png', qr, (err) => {
      if (err) console.log('Error generating the QR code:', err);
      console.log('QR code saved as qr-code.png');
    });
  });

  client.on('ready', () => {
    console.log('Client is ready.');
  });

  client.on('message', async (msg) => {
    const userId = msg.from;

    if (msg.type !== 'chat' && !msg.hasMedia) return;

    try {
      const userData = dataStore.getUserData(userId);

      if (msg.body.toLowerCase() === 'hi bella') {
        const greeting =
          "Hello! I'm thrilled to help you highlight your beauty. 😊 What would you like to know today? You can ask me about products, skincare tips, or even get a personalized facial analysis. I'm here for you!";
        msg.reply(greeting);

        msg.reply('To start our conversation, could you tell me your name?');

        dataStore.setUserData(userId, { expectingName: true });
        dataStore.deleteConversation(userId);
      } else if (userData.expectingName) {
        const name = msg.body.trim();
        dataStore.setUserData(userId, { name, expectingName: false, expectingAge: true });
        msg.reply(
          `Nice to meet you, ${name}! Could you also tell me your age? Some makeup and skincare products vary by age for better results.`
        );
      } else if (userData.expectingAge) {
        const ageInput = msg.body.trim().toLowerCase();
        if (ageInput === 'skip') {
          dataStore.setUserData(userId, { expectingAge: false });
          msg.reply('No problem! How can I assist you today?');
        } else {
          const age = parseInt(ageInput);
          if (!isNaN(age)) {
            dataStore.setUserData(userId, { age, expectingAge: false });
            msg.reply('Thank you! How can I assist you today?');
          } else {
            msg.reply("Please provide your age as a number, or type 'skip' to proceed.");
          }
        }
      } else if (isFinishingLine(msg.body)) {
        const farewell = `I'm glad I could help${
          userData.name ? ', ' + userData.name : ''
        }. If you have more questions, feel free to ask. Goodbye!`;
        msg.reply(farewell);
        dataStore.deleteConversation(userId);
        dataStore.deleteUserData(userId);
      } else {
        if (msg.hasMedia) {
          const media = await msg.downloadMedia();
          await processImage(media, userId, client, msg);
        } else {
          const response = await callChatGPT(userId, msg.body);
          const followUp =
            '\n\nWould you like to see how the makeup would look on your face? If yes, you can upload a photo!';
          msg.reply(response + followUp);
        }
      }
    } catch (error) {
      console.error('Error:', error.message);
      msg.reply("I'm sorry, I had trouble processing your request.");
    }
  });
}

module.exports = {
  initialize,
};
