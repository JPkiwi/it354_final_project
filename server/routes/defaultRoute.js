const express = require("express");
const route = express.Router();

const controller = require('../controller/defaultController');

// default directory, go to index/landing page
route.get('/', controller.getLandingPage);

module.exports = route;