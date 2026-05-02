const express = require('express');
const route = express.Router();
const rateLimit = require("express-rate-limit");
const { formatTo12Hour } = require("../services/timeService");

// imports functions defined in appointmentController.js so server.js can use them
const controller = require('../controller/appointmentController');


// booking rate limiting
const bookingLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // 3 attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).render("studentIndex", {
      error: "Too many booking attempts. Please exit the page and try again later.",
      title: "Book an Appointment",
      cssStylesheet: "studentStyle.css",
      jsFile: "studentScript.js",
      form: {},
      user: req.session.user,
      courses: [],
      availableShifts: [],
      formatTo12Hour
    });
  }
});

// tells Express when the booking form is submitted, run the bookAppointment function book for student, booking limiter applied here
route.post('/bookAppointment', bookingLimiter, controller.bookAppointment);

// display the student's booked appointments
route.get('/studentAppointment', controller.getBookedAppointments);

// change password on submit
route.post('/changePassword', controller.changePassword);

module.exports = route;
