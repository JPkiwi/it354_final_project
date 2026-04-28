const express = require('express');
const route = express.Router();
const rateLimit = require("express-rate-limit");
const { formatTo12Hour } = require("../services/timeService");

const controller = require('../controller/adminController');


// cancellation rate limiting
const cancelLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // 3 attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).render("adminIndex", {
      error: "Too many cancellation attempts. Please exit the page and try again later.",
      title: "Admin Page",
      cssStylesheet: "adminIndex.css",
      jsFile: "adminIndex.js",
      user: req.session.user,
      appointments: [],
      courses: [],
      eligibleTutorShifts: [],
      studentFName: "",
      studentLName: "",
      date: "",
      time: "",
      course: "",
      notificationLogs: [],
      formatTo12Hour,
    });
  }
});


// renders adminIndex
route.get('/adminIndex', controller.getAdminIndex);

// renders adminAvailabilityIndex
route.get('/adminAvailabilityIndex', controller.getAdminAvailabilityIndex);
// Receives POST request to toggle tutor active status
route.post("/adminTutorIndex/toggle", controller.toggleTutorStatus);

// renders adminAuditLog
route.get('/adminAuditLog', controller.getAdminAuditLog);

// renders adminTutorIndex
route.get('/adminTutorIndex', controller.getAdminTutorIndex);

// renders adminStudentIndex
route.get('/adminStudentIndex', controller.getAdminStudentIndex);

// Receives POST request to toggle student active status
route.post("/adminStudentIndex/toggle", controller.toggleStudentStatus);

// Handles form submission to create a new user (student or tutor)
route.post("/addUser", controller.addUser);

// Handles form submission to edit an existing user (student or tutor)
route.post('/editUser', controller.editUser)

// Handles form submission to change weekday hours
route.post("/changeHours", controller.changeHours);

// Handles form submission to assign tutor hours
route.post("/assignTutorHours", controller.assignTutorHours);


// View Available Tutor Shifts 
// route.post("/viewAvailableTutorShifts", controller.viewAvailableTutorShifts);

// Handles the deletion of tutor shifts under specific tutor on specific day
route.post("/clearTutorHours/remove", controller.clearTutorHours);

// Handles admin viewing a specific tutor's schedule
route.post("/adminTutorIndex/viewSchedule", controller.adminViewTutorShedule);

// Handles admin cancelling an appointment, cancel limiter applied here
route.post("/adminIndex/cancelAppointment", cancelLimiter, controller.adminCancelAppointment);

// Handles admin setting a blackout (fully closing specified date(s))
route.post("/addBlackoutDate",controller.addBlackoutDate);

// Handles admin adding a partial-day closed time block
route.post("/addException", controller.addException);

// Handles admin removing an exception or blackout date
route.post("/removeExceptions", controller.removeExceptions);

module.exports = route;
