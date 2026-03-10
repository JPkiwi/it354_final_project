const express = require('express');
const route = express.Router();

const controller = require('../controller/adminController');

// renders adminIndex
route.get('/adminIndex', controller.getAdminIndex);

// renders adminAvailabilityIndex
route.get('/adminAvailabilityIndex', controller.getAdminAvailabilityIndex);
// (re)Renders adminTutorIndex when tutor active status is toggled
route.post("/adminTutorIndex/toggle", controller.toggleTutorStatus);



// renders adminTutorIndex
route.get('/adminTutorIndex', controller.getAdminTutorIndex);

// renders adminStudentIndex
route.get('/adminStudentIndex', controller.getAdminStudentIndex);

module.exports = route;
