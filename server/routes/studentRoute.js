const express = require('express');
const route = express.Router();

const controller = require('../controller/studentController');

// renders studentIndex
route.get('/studentIndex', controller.getStudentIndex);

// display available appointments for the day and course selected by the student
route.post('/viewAvailableAppointments', controller.viewAvailableAppointments);

// POST route for handling student cancel appointment 
route.post('/studentAppointment/cancel/:appointmentId', controller.cancelAppointment);

module.exports = route;

