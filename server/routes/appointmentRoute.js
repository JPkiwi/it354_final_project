const express = require('express');
const route = express.Router();

// imports functions defined in appointmentController.js so server.js can use them
const controller = require('../controller/appointmentController');

// tells Express when the booking form is submitted, run the createAppointment function
route.post('/scheduleAppointment', controller.createAppointment);

// this is not currently working fully. It is more of a placeholder
// eventually this will be used to display the student's booked appointments
route.get('/studentAppointment', controller.getBookedAppointments);

module.exports = route;
