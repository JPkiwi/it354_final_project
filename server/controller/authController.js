// add any models needed here

const { oauth2Client, SCOPES } = require('../config/googleAuth');

// Redirect user to Google login
exports.redirectToGoogleLogin = async (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    res.redirect(url);
};

// Google redirects back here with a code
exports.googleCallback = async (req, res) => {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    req.session.tokens = tokens;
    oauth2Client.setCredentials(tokens);
    res.redirect('/studentIndex');
};

// GET
exports.getLoginPage = async (req, res) => {
    res.render('login', 
        {
            error: null,
            title: 'Login Page',
            cssStylesheet: 'login.css',
            jsFile: null,
            user: null
    });
};

// GET
exports.getSignupPage = async (req, res) => {
    res.render('signup', 
        {
            error: null,
            title: 'Signup Page',
            cssStylesheet: 'signup.css',
            jsFile: 'signup.js',
            user: null
    });
};
// POST
// MARK: Functionality for signup
exports.useSignupInfo = async (req, res) => {
    // console.log(req.body);
    res.sendStatus(202); // accepted
};

// POST
// MARK: Functionality for logout
