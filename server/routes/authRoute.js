const express = require('express');
const route = express.Router();

const controller = require('../controller/authController');

// Step 1: Redirect user to Google login
route.get('/auth/google', controller.redirectToGoogleLogin);

// Step 2: Google redirects back here with a code
route.get('/auth/google/callback', controller.googleCallback);


// when select the login button on the index page, go to the login page
route.get('/login', controller.getLoginPage);

// when select the signup button on the index page, go to the signup page
route.get('/signup', controller.getSignupPage);

// when enter credentials and submit on the login page, get the request body
route.post('/login', controller.useLoginInfo);

// when enter credentials and submit on the signup page, get the request body
route.post('/signup', controller.useSignupInfo);

// when user logs out, end session


module.exports = route;
