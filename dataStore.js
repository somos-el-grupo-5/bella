const conversations = {};
const userData = {};

module.exports = {
  getConversation(userId) {
    return conversations[userId] || [];
  },
  addMessageToConversation(userId, message) {
    if (!conversations[userId]) {
      conversations[userId] = [];
    }
    conversations[userId].push(message);
  },
  deleteConversation(userId) {
    delete conversations[userId];
  },
  getUserData(userId) {
    return userData[userId] || {};
  },
  setUserData(userId, data) {
    userData[userId] = { ...userData[userId], ...data };
  },
  deleteUserData(userId) {
    delete userData[userId];
  },
};
