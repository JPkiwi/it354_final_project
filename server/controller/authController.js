const bcrypt = require('bcrypt');
const User = require('../model/userModel');

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

// Functionality for Login
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        // checks to see if this user exists
        if (!user) {
            return res.render('login', {
                error: 'Invalid email or password.',
                title: 'Login',
                cssStylesheet: 'login.css',
                jsFile: null,
                user: null
            });
        }
    

        // checking for a password match
        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
            return res.render('login', {
                error: 'Invalid email or password.',
                title: 'Login',
                cssStylesheet: 'login.css',
                jsFile: null,
                user: null
            });
        }

        // stores user in session
        req.session.user = user;

        // checks user's role, redirects them to their corresponding index page
        if (user.role === "admin") {
            res.redirect('/adminIndex');
        }
        else if (user.role === "tutor") {
            res.redirect('/tutorIndex');
        }
        else {
            res.redirect('/studentIndex');
        }
    }
    catch (err) {
        console.error(err);
        res.render('login', {
            error: 'Something went wrong. Please try again.',
            title: 'Login',
            cssStylesheet: 'login.css',
            jsFile: null,
            user: null
        });
    }
}

// Functionality for Logout
exports.logout = async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
        }
        res.redirect('/');
    });
};

