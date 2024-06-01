const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(bodyParser.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PORT = process.env.PORT || 1337;

app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

app.post('/webhook', (req, res) => {
    console.log('Evento recibido desde Facebook Messenger:');
    // console.log(JSON.stringify(req.body, null, 2));  // Log the entire request body from Messenger

    res.status(200).send('EVENT_RECEIVED');
    const body = req.body;

    if (body.object === 'page') {
        body.entry.forEach(entry => {
            entry.messaging.forEach(messagingEvent => {
                if (messagingEvent.message) {
                    console.log(`Mensaje de Facebook: Usuario ${messagingEvent.sender.id} dice "${messagingEvent.message.text}"`);
                    handleMessage(messagingEvent.sender.id, messagingEvent.message);
                } else if (messagingEvent.postback) {
                    handlePostback(messagingEvent.sender.id, messagingEvent.postback);
                }
            });
        });
    }
});

function handleMessage(sender_psid, message) {
    if (message.text) {
        callOpenAIAPI(message.text, response => {
            // console.log(`Respuesta de OpenAI a "${message.text}": ${response}`);
            let responseMessage = { text: response };
            callSendAPI(sender_psid, responseMessage);
        });
    }
}

function callOpenAIAPI(message, callback) {
    const options = {
        method: 'POST',
        url: 'https://api.openai.com/v1/chat/completions',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: "Facebook chatbot conversation" }, { role: "user", content: message }]
        })
    };

    request(options, (error, response, body) => {
        if (error) {
            console.error('Error al llamar a la API de OpenAI:', error);
            return;
        }
        try {
            const json = JSON.parse(body);
            if (json.choices && json.choices.length > 0 && json.choices[0].message && json.choices[0].message.content) {
                callback(json.choices[0].message.content.trim());
            } else {
                console.error('No se recibieron opciones válidas de la API de OpenAI.');
            }
        } catch (err) {
            console.error('Error al procesar la respuesta de la API de OpenAI:', err);
        }
    });
}

function callSendAPI(sender_psid, response) {
    const request_body = { recipient: { id: sender_psid }, message: response };
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: request_body
    }, (err, res, body) => {
        if (!err) {
            console.log(`Respuesta: "${response.text}"`);
        } else {
            console.error('No se pudo enviar el mensaje a Facebook:', err);
        }
    });
}

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
