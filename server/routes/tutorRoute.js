const express = require('express');
const route = express.Router();

const controller = require('../controller/tutorController');

// renders tutorIndex
route.get('/tutorIndex', controller.getTutorIndex);

module.exports = route;
