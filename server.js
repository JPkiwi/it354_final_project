const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const connectMongo = require("./server/database/connect");
const session = require('express-session'); // allows us to store session tokens (logging into Google Calendar)

// const seedOpenCenter = require("./server/seed/seedOpenCenter");
// const seedData = require("./server/seed/seedData");

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const path = require("path");
const { connect } = require("http2"); // not being used currently

// Logging
app.use(morgan("tiny"));

// --- Google Calendar API Session Management ---
// A session allows our server to remember things about a user between requests
// In this case, it'll store the user's Google OAuth tokens so they STAY authenticated
// as they move around our web app.
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  }),
);

// view engine
app.set("view engine", "ejs");

// Static files (css, frontend js, images)
app.use(express.static("assets"));

// Default route
const defaultRoute = require("./server/routes/defaultRoute");
app.use("/", defaultRoute);

// Appointment route
const appointmentRoute = require("./server/routes/appointmentRoute");
app.use("/", appointmentRoute);

// Admin route
const adminRoute = require("./server/routes/adminRoute");
app.use("/", adminRoute);

// imports our auth router
const authRoute = require("./server/routes/authRoute");
// registers our auth routes with Express so they are accessible when someone goes to these URLs
app.use("/", authRoute);

// Tutor route
const tutorRoute = require("./server/routes/tutorRoute");
app.use("/", tutorRoute);

// Student route
const studentRoute = require("./server/routes/studentRoute");
app.use("/", studentRoute);


// connect to the database
connectMongo();

// add default admin to MongoDB
const defaultAdmin = require("./server/config/defaultAdmin");
defaultAdmin.createAdminAccount();

// listening on port
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
