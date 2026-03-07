const express = require('express');
const route = express.Router();

const controller = require('../controller/adminController');

// renders adminIndex
route.get('/adminIndex', controller.getAdminIndex);;

module.exports = route;
