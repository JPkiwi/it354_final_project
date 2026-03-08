const express = require("express");
const route = express.Router();

const controller = require('../controller/defaultController');

// default directory, go to index/home page
route.get('/', controller.getLandingPage);

module.exports = route;