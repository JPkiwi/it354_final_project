const express = require('express');
const route = express.Router();

const controller = require('../controller/adminController');

// renders adminIndex
route.get('/adminIndex', controller.getAdminIndex);

// renders adminAvailabilityIndex
route.get('/adminAvailabilityIndex', controller.getAdminAvailabilityIndex);
// Receives POST request to toggle tutor active status
route.post("/adminTutorIndex/toggle", controller.toggleTutorStatus);



// renders adminTutorIndex
route.get('/adminTutorIndex', controller.getAdminTutorIndex);

// renders adminStudentIndex
route.get('/adminStudentIndex', controller.getAdminStudentIndex);

// Receives POST request to toggle student active status
route.post("/adminStudentIndex/toggle", controller.toggleStudentStatus);

// Handles form submission to create a new user (student or tutor)
route.post("/adminUsers/add", controller.addUser);

// Handles form submission to change weekday hours
route.post("/changeHours", controller.changeHours);

// Handles form submission to assign tutor hours
route.post("/assignTutorHours/add", controller.assignTutorHours);

// Handles the deletion of tutor shifts under specific tutor on specific day
route.post("/clearTutorHours/remove", controller.clearTutorHours);

module.exports = route;
