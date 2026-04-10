const bcrypt = require('bcrypt');
const User = require('../model/userModel');
const CenterOpen = require("../model/centerOpenSchedule");
const Course = require("../model/courseModel");
const { DEFAULT_WEEK_HOURS, DEFAULT_COURSES } = require("../config/defaultData");

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
    try {
        const { code } = req.query;

        // exchange code for tokens
        /* The "tokens" consist of 3 different tokens:
        * 1. access_token - makes API calls (Google Calendar) (1 hour lifspan)
        * 2. refresh_token - gets a new access token when it expires (Long-lived lifespan)
        * 3. id_token - proves who the user is (email/name/etc) (Single use lifespan)
        */
        const { tokens } = await oauth2Client.getToken(code);
        req.session.tokens = tokens;
        oauth2Client.setCredentials(tokens);

        // get user's email from the token
        const ticket = await oauth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        
        // Here, Google is sending back a JWT, and then getPayload()
        // decodes the string into a plain JavaScript object with the user's
        // info, that way we can grab the email.
        const { email } = ticket.getPayload();

        // checking to make sure this email belongs to our DB
        const admin = await User.findOne({email, role:"admin"});

        if (!admin) {
            return res.render('login', 
        {
            error: "No admin found for that Google Account.",
            title: 'Login Page',
            cssStylesheet: 'login.css',
            jsFile: null,
            user: null
        });
        }

        // setting our session
        req.session.user = admin;

        res.redirect('/adminIndex');

    } catch (err) {
        res.render("login", {
            error: "Google login failed. Please try again.",
            title: 'Login Page',
            cssStylesheet: 'login.css',
            jsFile: null,
            user: null
        });
    }
};

// GET
exports.getLoginPage = async (req, res) => {
    try {
        let weekdays = await CenterOpen.find();
        let courses = await Course.find();
        
        // if there are no weekdays in MongoDB, then insert all the default week hours
        if (weekdays.length === 0) {
            weekdays = await CenterOpen.insertMany(DEFAULT_WEEK_HOURS);
        }

        // if there are no courses in MongoDB, then insert all the default courses
        // this assumes no tutors have been added yet and therefore no courses have been assigned. 
        if (courses.length === 0){
            courses = await Course.insertMany(DEFAULT_COURSES); 
        }

        res.render('login', 
        {
            error: null,
            title: 'Login Page',
            cssStylesheet: 'login.css',
            jsFile: null,
            user: null
        });
    } catch (err) {
        res.render('login', 
        {
            error: "Unable to load login details.",
            title: 'Login Page',
            cssStylesheet: 'login.css',
            jsFile: null,
            user: null
        });
    }
};

// Functionality for Login
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        // checks to see if this user exists or if password doesn't match
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.render('login', {
                error: 'Invalid email or password.',
                title: 'Login',
                cssStylesheet: 'login.css',
                jsFile: null,
                user: null
            });
        }

        // checks to see if user is active
        if (!user.isActive) {
            return res.render('login', {
                error: 'Account is no longer active.',
                title: 'Login',
                cssStylesheet: 'login.css',
                jsFile: null,
                user: null
            });
        }

        // checks to see if user is an admin
        // if so, admins need to use Google OAuth to sign in.
        if (user.role === "admin") {
            return res.render('login', {
                error: 'Admins must log in using Google.',
                title: 'Login',
                cssStylesheet: 'login.css',
                jsFile: null,
                user: null
            });
        }

        // stores user in session
        req.session.user = user;

        // checks user's role, redirects them to their corresponding index page
        if (user.role === "tutor") {
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

