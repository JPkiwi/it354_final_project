const express = require('express'); 
const dotenv = require("dotenv");
const morgan = require("morgan");
const connectMongo = require("./server/database/connect");
const session = require('express-session'); // allows us to store session tokens (logging into Google Calendar)

// imports these two functions defined in appointmentController.js so server.js can use them
const { getBookingPage, createAppointment } = require('./server/controller/appointmentController');

// instances of User and TutorShift
// imports the Mongoose models, validates data, and inserts into MongoDB collection
// once validated.
const User = require('./server/model/userModel');
const TutorShift = require('./server/model/tutorShiftModel');

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PORT = process.env.PORT || 3000; 
const path = require('path');
const { connect } = require('http2'); // not being used currently

// Logging
app.use(morgan("tiny"));

// --- Google Calendar API Session Management ---
// A session allows our server to remember things about a user between requests
// In this case, it'll store the user's Google OAuth tokens so they STAY authenticated
// as they move around our web app.
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

// view engine
app.set("view engine", "ejs");

// Static files (css, frontend js, images)
app.use(express.static("assets"));

// Default route
const defaultRoute = require("./server/routes/defaultRoute");
app.use("/", defaultRoute);

// tells Express to run the getBookingPage function when someone navigates to /studentAppointment
app.get('/studentAppointment', getBookingPage);

// tells Express when the booking form is submitted, run the createAppointment function
app.post('/studentAppointment', createAppointment);

// when select the login button on the index page, go to the login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// when select the signup button on the index page, go to the signup page
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

// when enter credentials and submit on the login page, get the request body
app.post('/login', (req, res) => {
  console.log(req.body);
  res.sendStatus(202); // accepted
});

// when enter credentials and submit on the signup page, get the request body
app.post('/signup', (req, res) => {
  console.log(req.body);
  res.sendStatus(202); // accepted
});

// after hitting submit for either login or signup, go to the admin page (this will eventually change depending on the user)
app.post('/adminIndex', (req, res) => {
  console.log(req.body);
  // res.sendStatus(202); // accepted
  res.sendFile(path.join(__dirname, 'adminIndex.html'));
});

// imports our auth router
const { router: authRoute } = require('./server/routes/authRoute');

// registers our auth routes with Express so they are accessible when someone goes to these URLs
app.use('/', authRoute);

// renders studentIndex
app.get('/studentIndex', (req, res) => {
    res.render('studentIndex', {
        title: 'Student Index',
        cssStylesheet: 'studentIndex.css',
        jsFile: 'studentScript.js',
        error: null,
        user: { role: 'student' } // TEMPORARY PLACE HOLDER
        // eventually we will replace this with a real user, like: req.session.user
    });
});

// TEMPORARY TEST DATA - one admin/one tutor/one shift
app.get('/seed', async (req, res) => {
    try {
        // create a test admin
        const admin = await User.create({
            role: 'admin',
            fname: 'Admin',
            lname: 'User',
            email: 'admin@ilstu.edu',
            passwordHash: 'hashedpassword123'
        });

        // create a test tutor
        const tutor = await User.create({
            role: 'tutor',
            fname: 'John',
            lname: 'Doe',
            email: 'tutor@ilstu.edu',
            passwordHash: 'hashedpassword123'
        });

        // create a test tutor shift
        await TutorShift.create({
            tutorId: tutor._id,
            assignedByAdminId: admin._id,
            shiftDate: new Date('2026-03-10'),
            startTime: '10:00',
            endTime: '11:00',
            isBooked: false
        });

        res.send('Test data seeded successfully!');
    } catch (err) {
        console.error(err);
        res.send('Seeding failed: ' + err.message);
    }
});

// connect to the database
connectMongo();

// listening on port
app.listen(PORT, () => { 
  console.log('Server running on port', PORT); 
}); 
