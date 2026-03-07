const express = require('express');
const route = express.Router();

const controller = require('../controller/studentController');

// renders studentIndex
route.get('/studentIndex', controller.getStudentIndex);;

module.exports = route;
