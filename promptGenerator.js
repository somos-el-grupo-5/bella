const dataStore = require('./dataStore');
const { generateProductSummary } = require('./products');

function generateSystemPrompt(userId) {
  const productSummary = generateProductSummary();
  const userData = dataStore.getUserData(userId);
  const userName = userData.name || '';
  const userAge = userData.age || '';
  return `You are Bella, a virtual assistant from Belcorp. Your job is to help customers with recommendations about Belcorp's makeup products. You should only recommend products from the following list:\n${productSummary}\nIf a user asks for a product that is not on the list, kindly inform them that these are the available products and suggest alternatives from the list.\nUse the user's name${
    userName ? ` (${userName})` : ''
  } whenever possible.${userAge ? ` The user is ${userAge} years old.` : ''}`;
}

module.exports = {
  generateSystemPrompt,
};
