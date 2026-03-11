const express = require('express');
const route = express.Router();

// imports functions defined in appointmentController.js so server.js can use them
const controller = require('../controller/appointmentController');

// tells Express when the booking form is submitted, run the bookAppointment function book for student
route.post('/bookAppointment', controller.bookAppointment);

// display the student's booked appointments
route.get('/studentAppointment', controller.getBookedAppointments);

// display the tutor's booked appointments
route.get('/tutorAppointment', controller.getTutorAppointments);

module.exports = route;
