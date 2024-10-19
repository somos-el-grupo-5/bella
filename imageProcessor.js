const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { MessageMedia } = require('whatsapp-web.js');
const { getHexCode } = require('./openaiClient');

async function processImage(media, userId, client, msg) {
  const mediaPath = path.join(__dirname, `${userId}.png`);
  const processedPath = path.join(__dirname, `processed-${userId}.png`);

  fs.writeFile(mediaPath, media.data, { encoding: 'base64' }, async (err) => {
    if (err) {
      console.error('Error saving the image:', err);
    } else {
      console.log(`Image saved as ${userId}.png`);
      const formData = new FormData();
      formData.append('image', fs.createReadStream(mediaPath));

      let hexCode = await getHexCode(
        'Write the exact hexadecimal code of the color of the selected product with this format: `#xxxxxx`. Only return the hexadecimal code with nothing more. Not even a message, only the hexadecimal code.'
      );
      console.log(hexCode);
      formData.append('lip_color', hexCode);

      try {
        const response = await axios.post(
          'http://127.0.0.1:5000/process-image',
          formData,
          {
            headers: {
              ...formData.getHeaders(),
            },
            responseType: 'arraybuffer',
          }
        );

        fs.writeFileSync(processedPath, Buffer.from(response.data));
        console.log(`Processed image saved as processed-${userId}.png`);

        const processedImage = MessageMedia.fromFilePath(processedPath);
        await client.sendMessage(msg.from, processedImage);
        msg.reply('You look stunning with this color!!!');
      } catch (error) {
        console.error('Error posting the image to the server:', error.message);
      }
    }
  });
}

module.exports = {
  processImage,
};
