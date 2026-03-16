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


console.log("assignTutorHours type:", typeof controller.assignTutorHours);
console.log("controller keys:", Object.keys(controller));
// Handles form submission to assign tutor hours
route.post("/assignTutorHours/add", controller.assignTutorHours);

route.post("/clearTutorHours/remove", controller.clearTutorHours);

module.exports = route;
