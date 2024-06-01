const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

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

// Función para escribir en el archivo JSON
const writeJsonFile = (data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(jsonFilePath, JSON.stringify(data, null, 2), 'utf8', (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

router.get('/business-info', async (req, res) => {
  try {
    const data = await readJsonFile();
    res.json(data.information);
  } catch (error) {
    res.status(500).json({ error: 'Error al leer el archivo JSON' });
  }
});

router.post('/business-info', async (req, res) => {
  try {
    const data = await readJsonFile();
    data.information = req.body;
    await writeJsonFile(data);
    res.json({ message: 'Información actualizada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al escribir en el archivo JSON' });
  }
});

module.exports = {
  router
};
