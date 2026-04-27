const express = require('express');
const route = express.Router();
const rateLimit = require("express-rate-limit");

const controller = require('../controller/authController');


// login rate limiting
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 10, // 10 attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).render("login", {
      error: "Too many login attempts. Please wait and try again later.",
      title: 'Login Page',
      cssStylesheet: 'login.css',
      jsFile: 'login.js',
      user: null
    });
  }
});

// Step 1: Redirect user to Google login
route.get('/auth/google', controller.redirectToGoogleLogin);

// Step 2: Google redirects back here with a code
route.get('/auth/google/callback', controller.googleCallback);


// when select the login button on the index page, go to the login page
route.get('/login', controller.getLoginPage);

// when enter credentials and submit on the login page, get the request body
// login limiter applied here
route.post('/login', loginLimiter, controller.loginUser);

// when user logs out, end session
route.post('/logout', controller.logout);

module.exports = route;
