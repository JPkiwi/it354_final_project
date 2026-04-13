const { sendEmail } = require("../services/emailService");
const { confirmationTemplate, cancellationTemplate } = require("../../views/templates/appointmentEmail");
const Appointment = require("../model/appointmentModel");
const TutorShift = require("../model/tutorShiftModel");
const mongoose = require("mongoose");
const NotificationLog = require("../model/notificationLog");


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
    const shift = await TutorShift.findById(tutorShiftId).populate("tutorId", "fname lname");

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

    //check if student already has an appointment at that time
    const overlappingAppointment = await Appointment.findOne({
      studentId: req.session.user._id,
      appointmentDate: shift.shiftDate,
      startTime: shift.startTime,
      endTime: shift.endTime,
      appointmentStatus: "scheduled"
    });

    if (overlappingAppointment) {
      req.session.error = "You already have an appointment at that time.";
      return res.redirect("/studentIndex");
    }

    // book the appointment
    // reserve the shift first to avoid race condition where two students try to book the same shift at the same time. 
    const reservedShift = await TutorShift.findOneAndUpdate(
      { _id: tutorShiftId, isBooked: false }, 
      { isBooked: true }, 
      { new: true } 
    );
    
    if (!reservedShift) {
      req.session.error = "That appointment is no longer available.";
      return res.redirect("/studentIndex");
    }

    // create the appointment
    const appointment = new Appointment({
      studentId: req.session.user._id,
      tutorShiftId: reservedShift._id,
      course,
      appointmentDate: reservedShift.shiftDate,
      startTime: reservedShift.startTime,
      endTime: reservedShift.endTime,
      attendance: {
        attendanceStatus: "pending"
      }
    });

    await appointment.save();

    // send confirmation email to student and CC admin
    try {
      await sendEmail({
        to: req.session.user.email,
        cc: process.env.GMAIL_ADMIN, // CC admin
        subject: "Appointment Confirmation",
        html: confirmationTemplate({
          studentName: req.session.user.fname,
          tutorName: shift.tutorId.fname + " " + shift.tutorId.lname,
          date: shift.shiftDate.toLocaleDateString('en-US', { timeZone: 'UTC' }),
          time: `${shift.startTime} - ${shift.endTime}`,
          course
        })
      });

      // Admin notification log after email is sent (notification to be viewed by admin after clicking "notifications" 
      // on the "Manage Appointments" admin page)
    await NotificationLog.create({
      appointmentId: appointment._id,
      recipientUserId: req.session.user._id,
      appointmentDate: appointment.appointmentDate,
      notificationType: "ADMIN_NOTIF",
      isRead: false
    });

    } catch (emailErr) {
      console.error("Email sending error");
    }

    res.redirect("/studentIndex");
  } catch (err) {
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

    // get booked appointments that are scheduled (don't want to display cancelled status appointments)
    const bookedAppointments = await Appointment.find({
      studentId: req.session.user._id,
      appointmentStatus: "scheduled"
    });

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

