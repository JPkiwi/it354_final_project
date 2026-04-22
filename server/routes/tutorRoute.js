const express = require('express');
const route = express.Router();

const controller = require('../controller/tutorController');

// renders tutorIndex
route.get('/tutorIndex', controller.getTutorIndex);

// display the tutor's booked appointments
// route.get('/tutorIndex/tutorAppointment', controller.getTutorAppointments);

// update submitted comment in MongoDB for specific tutor appointment selected
route.post('/tutorIndex/submitComment', controller.submitComment);

// update submitted start and end times in MongoDB for specific tutor appointment selected
route.post('/tutorIndex/submitTimes', controller.submitTimes);

// update submitted show/now show in MongoDB for specific tutor appointment selected
route.post('/tutorIndex/submitShow', controller.submitShow);

// POST: if tutor submits any of the tutor features in form, calls post method instead of get method
route.post("/tutorIndex", (req, res) => {
    res.redirect("/tutorIndex");
});
// route.post("/tutorIndex/tutorAppointment", (req, res) => {
//     res.redirect("/tutorIndex/tutorAppointment");
// });

// display the cancelled appointments under specific tutor
route.get('/tutorCancelled', controller.getCancelledAppointments);

module.exports = route;
