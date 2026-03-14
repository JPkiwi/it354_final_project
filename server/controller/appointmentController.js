const { sendEmail } = require("../services/emailService");
const {confirmationTemplate, cancellationTemplate} = require("../../views/templates/appointmentEmail");
const Appointment = require("../model/appointmentModel");
const TutorShift = require("../model/tutorShiftModel");
const mongoose = require("mongoose");


// POST: handle bookAppointment form submission
exports.bookAppointment = async (req, res) => {
  try {
    // if not an auth user, send to login page
    if (!req.session.user) {
      return res.render('login', 
      {
        title: 'Login Page',
        cssStylesheet: 'login.css',
        jsFile: null,
        error: "User not logged in.",
        user: null,
      });
    }

    // if auth user but not a student, send to login page
    if (req.session.user.role !== "student") {
      return res.render('login', 
      {
        title: 'Login Page',
        cssStylesheet: 'login.css',
        jsFile: null,
        error: "Access denied. Only students can view this page.",
        user: req.session.user,
      });
    }

    // get the tutorShiftId and course
    const { tutorShiftId, course } = req.body;

    // get the selected shift
    const shift = await TutorShift.findById(tutorShiftId);

    // shift not available if doesn't exist or is booked
    if (!shift || shift.isBooked) {
      return res.render("studentAppointment", {
        title: "Book an Appointment",
        cssStylesheet: "studentAppointment.css",
        jsFile: "studentScript.js",
        error: "That shift is no longer available.",
        user: req.session.user,
        availableShifts: [],
        bookedAppointments: [],
      });
    }

    // create the appointment
    const appointment = new Appointment({
      studentId: req.session.user._id, // real auth needs to be set up
      tutorShiftId: shift._id,
      course,
      appointmentDate: shift.shiftDate,
      startTime: shift.startTime,
      endTime: shift.endTime,
    });

    await appointment.save();

    // mark the shift as booked
    shift.isBooked = true;
    await shift.save();

    // send confirmation email to student
    await sendEmail({
      to: req.session.user.email,
      subject: "Appointment Confirmation",
      html: confirmationTemplate({
        studentName: req.session.user.name,
        tutorName: shift.fname + " " + shift.lname,
        date: shift.shiftDate.toLocaleDateString(),
        time: `${shift.startTime} - ${shift.endTime}`,
        course
      })
    });

    res.redirect("/studentIndex");
  } catch (err) {
    console.error(err);
    res.render("studentAppointment", {
      title: "Book an Appointment",
      cssStylesheet: "studentStyle.css",
      jsFile: "studentScript.js",
      error: "Failed to book appointment.",
      user: req.session.user,
      availableShifts: [],
      bookedAppointments: [],
    });
  }
};


// GET: display the student's booked appointments
exports.getBookedAppointments = async (req, res) => {
  try {
    // if not an auth user, send to login page
    if (!req.session.user) {
      return res.render('login', 
      {
        title: 'Login Page',
        cssStylesheet: 'login.css',
        jsFile: null,
        error: "User not logged in.",
        user: null,
      });
    }

    // if auth user but not a student, send to login page
    if (req.session.user.role !== "student") {
      return res.render('login', 
      {
        title: 'Login Page',
        cssStylesheet: 'login.css',
        jsFile: null,
        error: "Access denied. Only students can view this page.",
        user: req.session.user,
      });
    }

    // get any booked appointments
    const bookedAppointments = await Appointment.find({ studentId: req.session.user._id });

    // render studentAppointment page with bookedAppointments
    res.render("studentAppointment", {
      title: "Booked Appointments",
      cssStylesheet: "studentStyle.css",
      jsFile: "studentScript.js",
      error: null,
      user: req.session.user,
      bookedAppointments,
    });
  } catch (err) {
    console.error(err);
    res.render("studentAppointment", {
      title: "Booked Appointments",
      cssStylesheet: "studentStyle.css",
      jsFile: "studentScript.js",
      error: "Failed to book appointment.",
      user: req.session.user,
      availableShifts: [],
      bookedAppointments: [],
    });
  }
};


// GET: display the tutor's booked appointments
exports.getTutorAppointments = async (req, res) => {
  try {
      // if not an auth user, send to login page
      if (!req.session.user) {
        return res.render('login', 
          {
            title: 'Login Page',
            cssStylesheet: 'login.css',
            jsFile: null,
            error: "User not logged in.",
            user: null
        });
      }

      // if auth user but not a tutor, send to login page
      if (req.session.user.role !== "tutor") {
        return res.render('login', 
          {
            title: 'Login Page',
            cssStylesheet: 'login.css',
            jsFile: null,
            error: "Access denied. Only tutors can view this page.",
            user: null
        });
      }

      // get current session user id and convert to ObjectId format for finding booked appointments
      const tutorId = new mongoose.Types.ObjectId(req.session.user._id);

      // get any booked appointments under current tutor user
      const bookedAppointments = await Appointment.aggregate([
        { $lookup: {from: "tutorshifts", localField: "tutorShiftId", foreignField: "_id", as: "tutorShift"} },
        { $unwind: "$tutorShift" },
        { $match: {"tutorShift.tutorId": tutorId, "tutorShift.isBooked": true, appointmentDate: { $gte: new Date(new Date().setUTCHours(0,0,0,0)) } } }, // shows appointments for today and future (not based on time)
        { $project: {course: 1, appointmentDate: 1, startTime: 1, endTime: 1, appointmentStatus: 1} },
        { $sort: { appointmentDate: 1, startTime: 1 } }
      ]);

      // render tutorIndex page with bookedAppointments under tutor
      res.render("tutorIndex", {
        title: "Tutor Appointments",
        cssStylesheet: "tutorStyle.css",
        jsFile: "tutorScript.js",
        error: null,
        user: req.session.user,
        bookedAppointments,
        appointmentsLoaded: true
      });
    } catch (err) {
      console.error("Tutor appointment error:", err);
      res.render("tutorIndex", {
        title: "Tutor Appointments",
        cssStylesheet: "tutorStyle.css",
        jsFile: "tutorScript.js",
        error: "Failed to show appointments.",
        user: req.session.user,
        bookedAppointments: [],
        appointmentsLoaded: true
      });
    }
}
