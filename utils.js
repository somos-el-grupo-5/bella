function isFinishingLine(text) {
  text = text.toLowerCase();
  return (
    text.includes('thank you') ||
    text.includes("that's all") ||
    text.includes('that is everything')
  );
}

module.exports = {
  isFinishingLine,
};
