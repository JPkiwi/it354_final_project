const express = require('express');
const route = express.Router();

// imports functions defined in appointmentController.js so server.js can use them
const controller = require('../controller/appointmentController');

// tells Express to run the getBookingPage function when someone navigates to /studentAppointment
route.get('/studentAppointment', controller.getBookingPage);

// tells Express when the booking form is submitted, run the createAppointment function
route.post('/studentAppointment', controller.createAppointment);

module.exports = route;
