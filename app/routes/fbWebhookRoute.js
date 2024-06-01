const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
require('dotenv').config();

const { chatCompletion } = require('../helper/openaiApi');
const { sendMessage, setTypingOff, setTypingOn } = require('../helper/messengerApi');

const jsonFilePath = path.join(__dirname, '../data/businessInfo.json');

// Función para leer el archivo JSON
const readJsonFile = () => {
  return new Promise((resolve, reject) => {
    fs.readFile(jsonFilePath, 'utf8', (err, data) => {
      if (err) {
        return reject(err);
      }
      try {
        const jsonData = JSON.parse(data);
        resolve(jsonData);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
};

router.get('/', (req, res) => {
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

router.post('/', async (req, res) => {
  try {
    let body = req.body;
    let senderId = body.entry[0].messaging[0].sender.id;
    let query = body.entry[0].messaging[0].message.text;

    // Leer información actualizada del archivo JSON
    const businessInfo = await readJsonFile();

    // Crear un bloque de texto con toda la información del negocio
    const businessDetails = Object.entries(businessInfo.information)
      .map(([key, value]) => `- ${key.replace(/_/g, ' ')}: ${value}`)
      .join('\n');

    // Crear el prompt personalizado
    const prompt = `
    You are an assistant for ${businessInfo.business_name}. Here is some key information about the business to help you answer questions accurately:
    ${businessDetails}

    The user may ask about these topics or other related aspects of the business. Provide helpful, accurate, and friendly responses based on the given information and your general knowledge as an AI.

    User's question: "${query}"
    `;

    await setTypingOn(senderId);
    let result = await chatCompletion(prompt);
    await sendMessage(senderId, result.response);
    await setTypingOff(senderId);
    console.log('Sender ID:', senderId);
    console.log('Response:', result.response);
  } catch (error) {
    console.log('Error:', error);
  }
  res.status(200).send('OK');
});

module.exports = {
  router
};
