const axios = require('axios');
const dataStore = require('./dataStore');
const { generateSystemPrompt } = require('./promptGenerator');

const apiKey = process.env.OPENAI_API_KEY;

async function callChatGPT(userId, message) {
  const url = 'https://api.openai.com/v1/chat/completions';

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  const systemPrompt = generateSystemPrompt(userId);
  const conversationHistory = dataStore.getConversation(userId);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: message },
  ];

  const data = {
    model: 'gpt-3.5-turbo',
    messages: messages,
  };

  try {
    const response = await axios.post(url, data, { headers });
    const result = response.data.choices[0].message.content;

    dataStore.addMessageToConversation(userId, { role: 'user', content: message });
    dataStore.addMessageToConversation(userId, { role: 'assistant', content: result });

    return result;
  } catch (error) {
    console.error(
      'Error calling the ChatGPT API:',
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

async function getHexCode(message) {
  const url = 'https://api.openai.com/v1/chat/completions';

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  const data = {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: message }],
  };

  try {
    const response = await axios.post(url, data, { headers });
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error(
      'Error calling the ChatGPT API:',
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

module.exports = {
  callChatGPT,
  getHexCode,
};
