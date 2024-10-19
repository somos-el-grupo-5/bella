const { Client, MessageMedia } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

const client = new Client();

// Objects to store conversation history and user data per user
const conversations = {};
const userData = {};

// Load products from products.json
const products = require('./products.json');

// Function to generate the product summary
function generateProductSummary(products) {
  return products.map(product => {
    return `- ${product.brand} ${product.name} (${product.category}) in color ${product.color}. Link: ${product.link}`;
  }).join('\n');
}

// Function to generate the system prompt including user data
function generateSystemPrompt(userId) {
  const productSummary = generateProductSummary(products);
  const userName = userData[userId]?.name || '';
  const userAge = userData[userId]?.age || '';
  return `You are Bella, a virtual assistant from Belcorp. Your job is to help customers with recommendations about Belcorp's makeup products. You should only recommend products from the following list:\n${productSummary}\nIf a user asks for a product that is not on the list, kindly inform them that these are the available products and suggest alternatives from the list.\nUse the user's name${userName ? ` (${userName})` : ''} whenever possible.${userAge ? ` The user is ${userAge} years old.` : ''}`;
}

client.on('qr', (qr) => {
  // Generate the QR code as an image
  QRCode.toFile('qr-code.png', qr, function (err) {
    if (err) console.log('Error generating the QR code:', err);
    console.log('QR code saved as qr-code.png');
  });
});

client.on('ready', () => {
  console.log('Client is ready.');
});

async function callChatGPT(userId, message) {
  const url = "https://api.openai.com/v1/chat/completions";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  // Generate the system prompt with user data
  const systemPrompt = generateSystemPrompt(userId);

  // Build the conversation messages
  const messages = [
    { role: "system", content: systemPrompt },
    ...(conversations[userId] || [])
  ];

  // Add the user's message to the conversation
  messages.push({ role: "user", content: message });

  const data = {
    model: "gpt-3.5-turbo",
    messages: messages,
  };

  try {
    const response = await axios.post(url, data, { headers });
    const result = response.data.choices[0].message.content;

    // Update the conversation history
    if (!conversations[userId]) {
      conversations[userId] = [];
    }
    conversations[userId].push({ role: "user", content: message });
    conversations[userId].push({ role: "assistant", content: result });

    return result;
  } catch (error) {
    console.error(
      "Error calling the ChatGPT API:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

function isFinishingLine(text) {
  text = text.toLowerCase();
  return (text.includes('thank you') || text.includes("that's all") || text.includes('that is everything'));
}

client.on('message', async (msg) => {
  const userId = msg.from;

  // Ignore status messages
  if (msg.type !== 'chat' && !msg.hasMedia) return;

  try {
    // Initialize conversation and ask for the user's name
    if (msg.body.toLowerCase() === 'hi bella') {
      const greeting = "Hello! I'm thrilled to help you highlight your beauty. 😊 What would you like to know today? You can ask me about products, skincare tips, or even get a personalized facial analysis. I'm here for you!";
      msg.reply(greeting);

      // Ask for the user's name
      msg.reply("To start our conversation, could you tell me your name?");
      // Set a flag indicating we're expecting the user's name
      userData[userId] = { expectingName: true };

      // Initialize conversation history
      conversations[userId] = [];

    } else if (userData[userId]?.expectingName) {
      // Store the user's name and ask for their age
      const name = msg.body.trim();
      userData[userId].name = name;
      userData[userId].expectingName = false;

      msg.reply(`Nice to meet you, ${name}! Could you also tell me your age? Some makeup and skincare products vary by age for better results.`);
      userData[userId].expectingAge = true;

    } else if (userData[userId]?.expectingAge) {
      // Handle the user's age response
      const ageInput = msg.body.trim().toLowerCase();
      if (ageInput === 'skip') {
        userData[userId].expectingAge = false;
        msg.reply("No problem! How can I assist you today?");
      } else {
        const age = parseInt(ageInput);
        if (!isNaN(age)) {
          userData[userId].age = age;
          userData[userId].expectingAge = false;
          msg.reply(`Thank you! How can I assist you today?`);
        } else {
          msg.reply("Please provide your age as a number, or type 'skip' to proceed.");
        }
      }
    } else if (isFinishingLine(msg.body)) {
      // Farewell and reset conversation
      const farewell = `I'm glad I could help${userData[userId]?.name ? ', ' + userData[userId].name : ''}. If you have more questions, feel free to ask. Goodbye!`;
      msg.reply(farewell);
      delete conversations[userId];
      delete userData[userId];

    } else {
      // Continue the conversation with the assistant
      const response = await callChatGPT(userId, msg.body);
      const followUp = "\n\nWould you like to see how the makeup would look on your face? If yes, you can upload a photo!";
      msg.reply(response + followUp);
    }
  } catch (error) {
    console.error("Error:", error.message);
    msg.reply("I'm sorry, I had trouble processing your request.");
  }

  // Handle image uploads
  if (msg.hasMedia) {
    const media = await msg.downloadMedia();

    // Save the user's uploaded image with userId
    const mediaPath = path.join(__dirname, `${userId}.png`);
    fs.writeFile(mediaPath, media.data, { encoding: 'base64' }, (err) => {
      if (err) {
        console.error('Error saving the image:', err);
      } else {
        console.log(`Image saved as ${userId}.png`);
      }
    });

    // Send the heart image as a response
    const heartImage = MessageMedia.fromFilePath(path.join(__dirname, './heart.png'));
    await client.sendMessage(msg.from, heartImage);
  }
});

client.initialize();
