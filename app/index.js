const express = require('express');
const cors = require('cors');
require('dotenv').config();

const webApp = express();

const PORT = process.env.PORT || 4000;

// Configurar CORS para permitir solicitudes desde cualquier origen
webApp.use(cors());

// Middlewares para parsear los cuerpos de las solicitudes
webApp.use(express.urlencoded({ extended: true }));
webApp.use(express.json());
webApp.use((req, res, next) => {
  console.log(`Path ${req.path} with Method ${req.method}`);
  next();
});

// Importar y usar las rutas
const homeRoute = require('./routes/homeRoute');
const fbWebhookRoute = require('./routes/fbWebhookRoute');
const businessInfoRoute = require('./routes/businessInfoRoute');

webApp.use('/', homeRoute.router);
webApp.use('/webhook', fbWebhookRoute.router);
webApp.use('/api', businessInfoRoute.router);

// Iniciar el servidor
webApp.listen(PORT, () => {
  console.log(`Server is up and running at ${PORT}`);
});
