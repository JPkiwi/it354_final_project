const { sendEmail } = require("../services/emailService");
const { confirmationTemplate } = require("../../views/templates/emailTemplates");
const Appointment = require("../model/appointmentModel");
const TutorShift = require("../model/tutorShiftModel");
const mongoose = require("mongoose");
const NotificationLog = require("../model/notificationLog");
const { createCalendarEvent } = require("../services/calendarService");
const User = require("../model/userModel");
const { formatTo12Hour } = require("../services/timeService");


// POST: handle bookAppointment form submission
exports.bookAppointment = async (req, res) => {
  let reservedShift; 

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

    // get the selected shift and reserve it to avoid race condition where two students try to book the same shift at the same time.
    reservedShift = await TutorShift.findOneAndUpdate(
      { _id: tutorShiftId, isBooked: false },
      { isBooked: true },
      { returnDocument: 'after' }
    ).populate("tutorId", "fname lname email"); // populating email for notification log

    if (!reservedShift) {
      req.session.error = "That appointment is no longer available.";
      return res.redirect("/studentIndex");
    }

    // check if student already has an appointment at that time
    const overlappingAppointment = await Appointment.findOne({
      studentId: req.session.user._id,
      appointmentDate: reservedShift.shiftDate,
      startTime: reservedShift.startTime,
      endTime: reservedShift.endTime,
      appointmentStatus: "scheduled",
    });

    if (overlappingAppointment) {
      // rollback shift reservation
      await TutorShift.findByIdAndUpdate(reservedShift._id, {
        isBooked: false,
      });

      req.session.error = "You already have an appointment at that time.";
      return res.redirect("/studentIndex");
    }

    // Prevent booking past appointments
    const shiftDateTime = new Date(reservedShift.shiftDate);
    const [hour, minute] = reservedShift.startTime.split(":").map(Number);
    shiftDateTime.setHours(hour, minute, 0, 0);

    if (new Date() > shiftDateTime) {
      await TutorShift.findByIdAndUpdate(reservedShift._id, { 
        isBooked: false 
      });
      req.session.error = "Cannot book past appointments.";
      return res.redirect("/studentIndex");
    }

    // book the appointment
    let appointment;
    try {
      appointment = await Appointment.create({
        studentId: req.session.user._id,
        tutorShiftId: reservedShift._id,
        course,
        appointmentDate: reservedShift.shiftDate,
        startTime: reservedShift.startTime,
        endTime: reservedShift.endTime,
        appointmentStatus: "scheduled",
        attendance: { attendanceStatus: "pending" },
      });
    } catch (err) {
      // 11000 is duplicate key error code from unique indexes in the schema. Either the shift was double-booked or the student has an overlapping appointment
      if (err.code === 11000) {
        await TutorShift.findByIdAndUpdate(reservedShift._id, {
          isBooked: false,
        });
        req.session.error = "Failed to book appointment due to a conflict.";
        return res.redirect("/studentIndex");
      }
      // throw error to outer catch block for any other errors
      throw err;
    }

    let emailFailed = false;
    try {
      await sendEmail({
        to: req.session.user.email,
        cc: process.env.GMAIL_ADMIN,
        subject: "Appointment Confirmation",
        html: confirmationTemplate({
          studentName: req.session.user.fname,
          tutorName: `${reservedShift.tutorId.fname} ${reservedShift.tutorId.lname}`,
          date: appointment.appointmentDate.toLocaleDateString("en-US", {
            timeZone: "UTC",
          }),
          time: `${appointment.startTime} - ${appointment.endTime}`,
          course: appointment.course,
        }),
      });

    } catch (emailErr) {
      emailFailed = true;
    }

    // create calendar event and send confirmation email asynchronously for faster response time 
    //catch any errors not caught in the individual functions to prevent unhandled promise rejections
    handleAfterBookingActions({
      appointment,
      shift: reservedShift,
      user: {
        _id: req.session.user._id,
        fname: req.session.user.fname,
        email: req.session.user.email
      },
      emailFailed,
    }).catch(() => {
      console.error("Error in after booking actions.");
    });

    if (emailFailed) {
      req.session.error = "Appointment booked, but failed to send confirmation email.";
    }

    return res.redirect("/studentIndex");

  } catch (err) {
    // if there was an error and we reserved a shift, we need to undo that so the shift does not stay reserved
    if (reservedShift) {
      await TutorShift.findByIdAndUpdate(reservedShift._id, {
        isBooked: false,
      });
    }
    res.render("studentAppointment", {
      title: "Book an Appointment",
      cssStylesheet: "studentStyle.css",
      jsFile: "studentScript.js",
      error: "Failed to book appointment.",
      user: req.session.user,
      availableShifts: [],
      bookedAppointments: [],
      pastBookedAppointments: [],
      formatTo12Hour
      
    });
  }
};

async function handleAfterBookingActions({ appointment, shift, user, emailFailed }) {
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
        studentFName: user.fname,
      });
      // store the event ID on the appointment for deletion later
      if (eventId) {
        appointment.calendarEventId = eventId; // unique ID assigned by google, stored in our appointmentModel
        await appointment.save();
      } else {
        console.error("No event ID returned from calendar API.");
      }
    }
  } catch (calendarErr) {
    console.error("Calendar event creation failed.");
  }

  // ────────────────────────────────────────────────────────────

  try {
    // Admin notification log after email is sent (notification to be viewed by admin after clicking "notifications" on the "Manage Appointments" admin page)
    // log the appointment was booked
    await NotificationLog.create({
      appointmentId: appointment._id,
      recipientUserId: user._id,
      appointmentDate: appointment.appointmentDate,
      notificationType: "STUDENT_BOOK_APPT",
    });
  } catch (err) {
    console.error("NotificationLog STUDENT_BOOK_APPT failed.");
  }

  // log if email failed to send
  if (emailFailed) {
    try {
      await NotificationLog.create({
        appointmentId: appointment._id,
        recipientUserId: user._id,
        appointmentDate: appointment.appointmentDate,
        notificationType: "SEND_EMAIL_FAILED",
      });

    } catch (err) {
      console.error("NotificationLog SEND_EMAIL_FAILED for student book appointment failed.");
    }
  }
}

// async function handleAfterBookingActions({ appointment, shift, user }) {
//   // ── Create Google Calendar event ────────────────────────────
//   try {
//     const admin = await User.findOne({ role: "admin" });
//     if (admin?.googleTokens) {
//       // checks for our admin and if the admin has tokens. returns undefined if not found
//       const eventId = await createCalendarEvent(admin.googleTokens, {
//         course: appointment.course,
//         appointmentDate: appointment.appointmentDate,
//         startTime: appointment.startTime,
//         endTime: appointment.endTime,
//         tutorFName: shift.tutorId.fname,
//         studentFName: user.fname,
//       });
//       // store the event ID on the appointment for deletion later
//       if (eventId) {
//         appointment.calendarEventId = eventId; // unique ID assigned by google, stored in our appointmentModel
//         await appointment.save();
//       } else {
//         console.error("No event ID returned from calendar API.");
//       }
//     }
//   } catch (calendarErr) {
//     console.error("Calendar event creation failed.");
//   }

//   // ────────────────────────────────────────────────────────────

//   // send confirmation email to student and CC admin
//   let emailSent = false;
//   try {
//     await sendEmail({
//       to: user.email,
//       cc: process.env.GMAIL_ADMIN,
//       subject: "Appointment Confirmation",
//       html: confirmationTemplate({
//         studentName: user.fname,
//         tutorName: `${shift.tutorId.fname} ${shift.tutorId.lname}`,
//         date: appointment.appointmentDate.toLocaleDateString("en-US", {
//           timeZone: "UTC",
//         }),
//         time: `${appointment.startTime} - ${appointment.endTime}`,
//         course: appointment.course,
//       }),
//     });
//     emailSent = true;

//   } catch (emailErr) {
//     console.error("Student book appointment email sending error.");
//   }

//   try {
//     // Admin notification log after email is sent (notification to be viewed by admin after clicking "notifications" on the "Manage Appointments" admin page)
//     // log the appointment was booked
//     await NotificationLog.create({
//       appointmentId: appointment._id,
//       recipientUserId: user._id,
//       appointmentDate: appointment.appointmentDate,
//       notificationType: "STUDENT_BOOK_APPT",
//     });
//   } catch (err) {
//     console.error("NotificationLog STUDENT_BOOK_APPT failed.");
//   }

//   // log if email failed to send
//   if (!emailSent) {
//     try {
//       await NotificationLog.create({
//         appointmentId: appointment._id,
//         recipientUserId: user._id,
//         appointmentDate: appointment.appointmentDate,
//         notificationType: "SEND_EMAIL_FAILED",
//       });

//     } catch (err) {
//       console.error("NotificationLog SEND_EMAIL_FAILED for student book appointment failed.");
//     }
//   }
// }

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
      formatTo12Hour
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
      formatTo12Hour
    });
  }
};
