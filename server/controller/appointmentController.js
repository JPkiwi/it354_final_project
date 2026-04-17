const { sendEmail } = require("../services/emailService");
const { confirmationTemplate } = require("../../views/templates/appointmentEmail");
const Appointment = require("../model/appointmentModel");
const TutorShift = require("../model/tutorShiftModel");
const mongoose = require("mongoose");
const NotificationLog = require("../model/notificationLog");
const { createCalendarEvent } = require("../services/calendarService");
const User = require("../model/userModel");

// POST: handle bookAppointment form submission
exports.bookAppointment = async (req, res) => {
  try {
    // if not an auth user, send to login page
    if (!req.session.user) {
      return res.render("login", {
        title: "Login Page",
        cssStylesheet: "login.css",
        jsFile: "login.js",
        error: "User not logged in.",
        user: null,
      });
    }

    // if auth user but not a student, send to login page
    if (req.session.user.role !== "student") {
      return res.render("login", {
        title: "Login Page",
        cssStylesheet: "login.css",
        jsFile: "login.js",
        error: "Access denied. Only students can view this page.",
        user: req.session.user,
      });
    }

    // get the tutorShiftId and course
    const { tutorShiftId, course } = req.body;

    // get the selected shift
    const shift = await TutorShift.findById(tutorShiftId).populate(
      "tutorId",
      // populating email for notification log
      "fname lname email",
    );

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
        pastBookedAppointments: [],
      });
    }

    //check if student already has an appointment at that time
    const overlappingAppointment = await Appointment.findOne({
      studentId: req.session.user._id,
      appointmentDate: shift.shiftDate,
      startTime: shift.startTime,
      endTime: shift.endTime,
      appointmentStatus: "scheduled",
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
      { new: true },
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
        attendanceStatus: "pending",
      },
    });

    await appointment.save();

    // ── Create Google Calendar event ────────────────────────────
    try {
      const admin = await User.findOne({ role: "admin" });
      if (admin?.googleTokens) {
        // checks for our admin and if the admin has tokens. returns undefined if not found
        const eventId = await createCalendarEvent(admin.googleTokens, {
          course: appointment.course,
          appointmentDate: appointment.appointmentDate,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          tutorFName: shift.tutorId.fname,
          studentFName: req.session.user.fname,
        });
        // store the event ID on the appointment for deletion later
        appointment.calendarEventId = eventId; // unique ID assigned by google, stored in our appointmentModel
        await appointment.save();
      }
    } catch (calendarErr) {
      return res.render("studentAppointment", {
        title: "Book an Appointment",
        cssStylesheet: "studentAppointment.css",
        jsFile: "studentScript.js",
        error: "Calendar event creation failed.",
        user: req.session.user,
        availableShifts: [],
        bookedAppointments: [],
        pastBookedAppointments: [],
      });
    }
    // ────────────────────────────────────────────────────────────

    // send confirmation email to student and CC admin
    try {
      await sendEmail({
        to: req.session.user.email,
        cc: process.env.GMAIL_ADMIN, // CC admin
        subject: "Appointment Confirmation",
        html: confirmationTemplate({
          studentName: req.session.user.fname,
          tutorName: `${shift.tutorId.fname} ${shift.tutorId.lname}`,
          date: appointment.appointmentDate.toLocaleDateString("en-US", {
            timeZone: "UTC",
          }),
          time: `${appointment.startTime} - ${appointment.endTime}`,
          course: appointment.course,
        }),
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
      console.error("Student book appointment email sending error.");
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
      pastBookedAppointments: [],
    });
  }
};

// GET: display the student's booked appointments
exports.getBookedAppointments = async (req, res) => {
  try {
    // if not an auth user, send to login page
    if (!req.session.user) {
      return res.render("login", {
        title: "Login Page",
        cssStylesheet: "login.css",
        jsFile: "login.js",
        error: "User not logged in.",
        user: null,
      });
    }

    // if auth user but not a student, send to login page
    if (req.session.user.role !== "student") {
      return res.render("login", {
        title: "Login Page",
        cssStylesheet: "login.css",
        jsFile: "login.js",
        error: "Access denied. Only students can view this page.",
        user: req.session.user,
      });
    }

    // get booked appointments that are scheduled status (don't want to display cancelled status appointments)
    let bookedAppointments = await Appointment.find({
      studentId: req.session.user._id,
      appointmentStatus: "scheduled",
    });

    // update appointment status to completed if past the current date and time
    for (let i = 0; i < bookedAppointments.length; i++) {
       const currAppointment = bookedAppointments[i];
       const currAppointmentDate = new Date(currAppointment.appointmentDate);
       // set the hours for the date of the current appointment to the end time using the stored hours
       currAppointmentDate.setHours(
          parseInt(currAppointment.endTime.split(":")[0]),
          parseInt(currAppointment.endTime.split(":")[1])
       );

       // update status to completed if current appointment status is set to scheduled and past the current time
       if (currAppointment.appointmentStatus === "scheduled" && currAppointmentDate < new Date()) {
          await Appointment.findByIdAndUpdate(currAppointment._id, { appointmentStatus: "completed" });
          bookedAppointments[i].appointmentStatus = "completed";
       }
    }

    // update booked appointments
    let updatedAppointments = [];
    for (let i = 0; i < bookedAppointments.length; i++) {
      // add appointment to updatedAppointments if the status is not completed (scheduled)
      if (bookedAppointments[i].appointmentStatus !== "completed") {
        updatedAppointments.push(bookedAppointments[i]);
      }
    }
    bookedAppointments = updatedAppointments;
    

    // get past booked appointments (based on completed appointment status)
    const pastBookedAppointments = await Appointment.find({
      studentId: req.session.user._id,
      appointmentStatus: "completed",
    });

    // render studentAppointment page with bookedAppointments and pastBookedAppointments
    res.render("studentAppointment", {
      title: "Booked Appointments",
      cssStylesheet: "studentStyle.css",
      jsFile: "studentScript.js",
      error: null,
      user: req.session.user,
      bookedAppointments,
      pastBookedAppointments,
    });
  } catch (err) {
    res.render("studentAppointment", {
      title: "Booked Appointments",
      cssStylesheet: "studentStyle.css",
      jsFile: "studentScript.js",
      error: "Failed to view appointments.",
      user: req.session.user,
      availableShifts: [],
      bookedAppointments: [],
      pastBookedAppointments: [],
    });
  }
};
