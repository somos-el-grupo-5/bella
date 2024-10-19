const { Client } = require('whatsapp-web.js');
const dotenv = require('dotenv');
dotenv.config();

const chatbot = require('./chatbot');

const client = new Client();

chatbot.initialize(client);

client.initialize();
