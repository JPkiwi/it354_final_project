const express = require('express');
const route = express.Router();

const controller = require('../controller/studentController');

// renders studentIndex
route.get('/studentIndex', controller.getStudentIndex);

// renders studentAppointment
route.get('/studentAppointment', controller.getStudentAppointments);

module.exports = route;
