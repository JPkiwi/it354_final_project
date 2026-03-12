const express = require("express");
const route = express.Router();
const { loginUser } = require('../controller/loginController');

route.get('login', (req, res) => {
    res.render('login', {
        title: 'Login',
        cssStylesheet: 'login.css',
        jsFile: null,
        user: null,
        error: null
    });
});

route.post('/login', loginUser);

module.exports = route;