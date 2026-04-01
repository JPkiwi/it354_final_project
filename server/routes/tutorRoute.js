const express = require('express');
const route = express.Router();

const controller = require('../controller/tutorController');

// renders tutorIndex
route.get('/tutorIndex', controller.getTutorIndex);

// display the tutor's booked appointments
route.get('/tutorIndex/tutorAppointment', controller.getTutorAppointments);

// update submitted comment in MongoDB for specific tutor appointment selected
route.post('/tutorIndex/submitComment', controller.submitComment);

// display specific tutor comments in comments text area if any for appointment selected
// route.get('/tutorIndex/viewComment', controller.viewComment);

module.exports = route;
