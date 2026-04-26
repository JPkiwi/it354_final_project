const bcrypt = require('bcrypt');
const User = require('../model/userModel');
const CenterOpen = require("../model/centerOpenSchedule");
const Course = require("../model/courseModel");
const { sendEmail } = require("../services/emailService");
const { accountDeactivationTemplate } = require("../../views/templates/emailTemplates");
const { DEFAULT_WEEK_HOURS, DEFAULT_COURSES } = require("../config/defaultData");

const { oauth2Client, SCOPES } = require('../config/googleAuth');

// Redirect user to Google login
exports.redirectToGoogleLogin = async (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent' // This forces a new refresh_token every login
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

        // get user's email from the token
        const ticket = await oauth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        
        // Here, Google is sending back a JWT, and then getPayload() which
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
            jsFile: 'login.js',
            user: null
        });
        }

        // Setting our googleTokens for admin
        admin.googleTokens = tokens;
        // writes our admin tokens to our MongoDB
        await admin.save();

        // setting our session
        req.session.user = admin;

        res.redirect('/adminIndex');

    } catch (err) {
        res.render("login", {
            error: "Google login failed. Please try again.",
            title: 'Login Page',
            cssStylesheet: 'login.css',
            jsFile: 'login.js',
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
            jsFile: 'login.js',
            user: null
        });
    } catch (err) {
        res.render('login', 
        {
            error: "Unable to load login details.",
            title: 'Login Page',
            cssStylesheet: 'login.css',
            jsFile: 'login.js',
            user: null
        });
    }
};


// non-blocking function for sending account deactivation email and 
// creating notification log on email send fail (similar to handleAfterBookingActions)
async function handleAfterDeactivationActions({ user }) {
  try {
    await sendEmail({
      to: user.email,
      cc: process.env.GMAIL_ADMIN,
      subject: "Account Deactivated",
      html: accountDeactivationTemplate({
        name: user.fname,
        date: new Date().toLocaleString("en-US"),
      }),
    });
  } catch (emailErr) {
    try {
      await NotificationLog.create({
        recipientUserId: user._id,
        appointmentDate: new Date(),
        notificationType: "ACCT_DEACTIVATION",
      });
    } catch (err) {
      console.error("NotificationLog ACCT_DEACTIVATION for suspicious activity account deactivation failed.");
    }
  }
}

// Functionality for Login
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        // ensures email is entered and in the form of @ilstu.edu
        const emailRegex = /^[^\s@]+@ilstu\.edu$/;
        if (!email || !emailRegex.test(email)) {
            return res.render('login', {
                error: 'Email address not in the form of @ilstu.edu.',
                title: 'Login',
                cssStylesheet: 'login.css',
                jsFile: 'login.js',
                user: null
            });
        }

         // make sure password is at least 8 characters long
        if (!password || password.length < 8) {
            // increment failedAttempts count (for non-admin users only)
            let updatedUser;
            if (user && user.role !== "admin") {
                updatedUser = await User.findByIdAndUpdate(
                    { _id: user._id},
                    { $inc: { failedAttempts: 1 } },
                    { returnDocument: 'after' }
                );
            }

            // if user fails to log in 4 times, deactivate user
            if (updatedUser && updatedUser.failedAttempts >= 4) {
                await User.updateOne(
                    { _id: user._id },
                    { $set: { failedAttempts: 0, isActive: false } }
                );

                // send user a suspicious activity/account deactivation email notification
                // create notificationLog document in the background if email fails
                handleAfterDeactivationActions({
                    user: {
                        _id: updatedUser._id,
                        fname: updatedUser.fname,
                        email: updatedUser.email
                    },
                }).catch(() => {
                    console.error("Error in after deactivation actions.");
                });

                return res.render('login', {
                    error: 'Too many login attempts for this email. Account has been deactivated. Please contact admin to reactive account.',
                    title: 'Login',
                    cssStylesheet: 'login.css',
                    jsFile: 'login.js',
                    user: null
                });
            }

            return res.render('login', {
                error: 'Password must be at least 8 characters long.',
                title: 'Login',
                cssStylesheet: 'login.css',
                jsFile: 'login.js',
                user: null
            });
        }

        // checks to see if this user exists or if password doesn't match
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {

            // increment failedAttempts count (for non-admin users only)
            let updatedUser;
            if (user && user.role !== "admin") {
                updatedUser = await User.findByIdAndUpdate(
                    { _id: user._id},
                    { $inc: { failedAttempts: 1 } },
                    { returnDocument: 'after' }
                );
            }

            // if user fails to log in 4 times, deactivate user
            if (updatedUser && updatedUser.failedAttempts >= 4) {
                await User.updateOne(
                    { _id: user._id },
                    { $set: { failedAttempts: 0, isActive: false } }
                );

                // send user a suspicious activity/account deactivation email notification
                // create notificationLog document in the background if email fails
                handleAfterDeactivationActions({
                    user: {
                        _id: updatedUser._id,
                        fname: updatedUser.fname,
                        email: updatedUser.email
                    },
                }).catch(() => {
                    console.error("Error in after deactivation actions.");
                });

                return res.render('login', {
                    error: 'Too many login attempts for this email. Account has been deactivated. Please contact admin to reactive account.',
                    title: 'Login',
                    cssStylesheet: 'login.css',
                    jsFile: 'login.js',
                    user: null
                });
            }

            return res.render('login', {
                error: 'Invalid email or password.',
                title: 'Login',
                cssStylesheet: 'login.css',
                jsFile: 'login.js',
                user: null
            });
        }

        // checks to see if user is active
        if (!user.isActive) {
            return res.render('login', {
                error: 'Account is no longer active.',
                title: 'Login',
                cssStylesheet: 'login.css',
                jsFile: 'login.js',
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
                jsFile: 'login.js',
                user: null
            });
        }

        // successfully able to login, reset count
        await User.updateOne(
            { _id: user._id },
            { $set: { failedAttempts: 0 } }
        );

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
        res.render('login', {
            error: 'Something went wrong. Please try again.',
            title: 'Login',
            cssStylesheet: 'login.css',
            jsFile: 'login.js',
            user: null
        });
    }
}

// Functionality for Logout
exports.logout = async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.render('login', {
                error: 'Something went wrong. Please try again.',
                title: 'Login',
                cssStylesheet: 'login.css',
                jsFile: 'login.js',
                user: null
            });
        }
        res.redirect('/');
    });
};

