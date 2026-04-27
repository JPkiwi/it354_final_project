const express = require('express');
const route = express.Router();
const rateLimit = require("express-rate-limit");
const { formatTo12Hour } = require("../services/timeService");

const controller = require('../controller/studentController');


// cancellation rate limiting
const cancelLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // 3 attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).render("studentAppointment", {
      error: "Too many cancellation attempts. Please exit the page and try again later.",
      title: "Booked Appointments",
      cssStylesheet: "studentStyle.css",
      jsFile: "studentScript.js",
      user: req.session.user,
      availableShifts: [],
      bookedAppointments: [],
      pastBookedAppointments: [],
      formatTo12Hour
    });
  }
});

// renders studentIndex
route.get('/studentIndex', controller.getStudentIndex);

// display available appointments for the day and course selected by the student
route.post('/viewAvailableAppointments', controller.viewAvailableAppointments);

// POST route for handling student cancel appointment, cancel limiter applied here
route.post('/studentAppointment/cancel/:appointmentId', cancelLimiter, controller.cancelAppointment);

module.exports = route;

