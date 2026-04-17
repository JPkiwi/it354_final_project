const Appointment = require("../model/appointmentModel");
const { sendEmail } = require("../services/emailService");
const { adminCancellationTemplate } = require("../../views/templates/appointmentEmail");
const User = require("../model/userModel");
const Course = require("../model/courseModel");
const TutorShift = require("../model/tutorShiftModel");
const CenterOpen = require("../model/centerOpenSchedule");
const centerClosedSchedule = require("../model/centerClosedSchedule");
const AuditLog = require("../model/auditLog");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const NotificationLog = require("../model/notificationLog");
const { deleteCalendarEvent } = require('../services/calendarService');
const CenterException = require("../model/centerException");





// helper function (will update later to remove repeat of this func/only call from here )
function formatTo12Hour(timeStr) {
  const [hourStr, minute] = timeStr.split(":");
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";

  hour = hour % 12;
  if (hour === 0) hour = 12;

  return `${hour}:${minute} ${ampm}`;
}



//-----------------------------------------------

async function getClosedWeekdays() {
  const centerSchedule = await CenterOpen.find();

  const weekdayMap = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const closedWeekdays = [];

  centerSchedule.forEach((day) => {
    if (day.isClosed) {
      closedWeekdays.push(weekdayMap[day.weekday]);
    }
  });

  return closedWeekdays;
}
// -------------------------------------------------------------------------------------------

// renders ADMIN INDEX
exports.getAdminIndex = async (req, res) => {
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

    // if auth user but not a admin, send to login page
    if (req.session.user.role !== "admin") {
      return res.render("login", {
        title: "Login Page",
        cssStylesheet: "login.css",
        jsFile: "login.js",
        error: "Access denied. Only admins can view this page.",
        user: null,
      });
    }

    const appointments = await Appointment.find({
      appointmentStatus: { $ne: "cancelled" },
    })
      .select("appointmentDate startTime endTime course studentId tutorShiftId")
      .populate({
        path: "studentId",
        select: "fname lname",
      })
      .populate({
        path: "tutorShiftId",
        select: "tutorId",
        populate: {
          path: "tutorId",
          model: "User",
          select: "fname lname",
        },
      })
      .lean();

    // find all courses in db
    const courses = await Course.find();

    // get notification logs for admin modal
    const notificationLogs = await NotificationLog.find({})
    .populate("recipientUserId", "fname lname")
    .populate("appointmentId", "appointmentDate startTime endTime")
    .sort({ actionTime: -1 });



    // render adminIndex view
    res.render("adminIndex", {
      error: null,
      title: "Admin Page",
      cssStylesheet: "adminIndex.css",
      jsFile: "adminIndex.js",
      user: req.session.user,
      appointments,
      courses,
      eligibleTutorShifts: [],
      studentFName: "",
      studentLName: "",
      date: "",
      time: "",
      course: "",
      notificationLogs
    });
  } catch (err) {
    // render same page, with error message & empty arrays passed
    // to ensure page does not break
    res.render("adminIndex", {
      error: "Could not load appointments.",
      title: "Admin Page",
      cssStylesheet: "adminIndex.css",
      jsFile: "adminIndex.js",
      user: req.session.user,
      appointments: [],
      courses: [],
      // default form values
      eligibleTutorShifts: [],
      studentFName: "",
      studentLName: "",
      date: "",
      time: "",
      course: "",
      notificationLogs: []
    });
  }
};

// -------------------------------------------------------------------------------------------


// POST: handle cancellation of an appointment from admin view (adminIndex)
exports.adminCancelAppointment = async (req, res) => {
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

    // if auth user but not a admin, send to login page
    if (req.session.user.role !== "admin") {
      return res.render("login", {
        title: "Login Page",
        cssStylesheet: "login.css",
        jsFile: "login.js",
        error: "Access denied. Only admins can view this page.",
        user: null,
      });
    }

    const appointmentId = req.body.appointmentId;
    const appointment = await Appointment.findById(
      appointmentId,
      "appointmentStatus tutorShiftId calendarEventId studentId appointmentDate startTime endTime course"
    )
    .populate("studentId", "fname lname email") 
    .populate({
      path: "tutorShiftId",
      populate: {
        path: "tutorId",
        select: "fname lname",
      },
    });


    if (!appointment) {
      return res.render("adminIndex", {
        error: "Appointment not found.",
        title: "Admin Page",
        cssStylesheet: "adminIndex.css",
        jsFile: "adminIndex.js",
        user: req.session.user,
        appointments: [],
        courses: [],
        eligibleTutorShifts: [],
        studentFName: "",
        studentLName: "",
        date: "",
        time: "",
        course: "",
        notificationLogs: []
      });
    }
    if (!appointment.tutorShiftId) {
      return res.render("adminIndex", {
        error: "Tutor shift missing on appointment.",
        title: "Admin Page",
        cssStylesheet: "adminIndex.css",
        jsFile: "adminIndex.js",
        user: req.session.user,
        appointments: [],
        courses: [],
        eligibleTutorShifts: [],
        studentFName: "",
        studentLName: "",
        date: "",
        time: "",
        course: "",
        notificationLogs: []
      });
    }
    // cancel appointment
    appointment.appointmentStatus = "cancelled";
    await appointment.save();

    // free the shift so it can be booked by another student
    await TutorShift.findByIdAndUpdate(appointment.tutorShiftId._id, {
      isBooked: false,
    });

    // audit log for cancel appointment
    await AuditLog.create({
      actionUserId: req.session.user._id, 
      actionType: "APPOINTMENT_CANCELLED",
      appointmentId: appointment._id, 
      targetUserId: appointment.studentId._id, 
      details: `Appointment on ${appointment.appointmentDate.toLocaleDateString('en-US', { timeZone: 'UTC' })} cancelled for student ${appointment.studentId.fname} ${appointment.studentId.lname} with tutor ${appointment.tutorShiftId.tutorId.fname} ${appointment.tutorShiftId.tutorId.lname}; tutor shift ${formatTo12Hour(appointment.tutorShiftId.startTime)} - ${formatTo12Hour(appointment.tutorShiftId.endTime)} reopened.`

    });
      

    // ───────── Delete Google Calendar event ────────────────────
    try {
      if (appointment.calendarEventId) {
        const admin = await User.findOne({ role: "admin" });
        if (admin?.googleTokens) {
          await deleteCalendarEvent(
            admin.googleTokens,
            appointment.calendarEventId,
          );
        }
      }
    } catch (calendarErr) {
      return res.render("adminIndex", {
        error: "Something went wrong with Google Calendar.",
        title: "Admin Page",
        cssStylesheet: "adminIndex.css",
        jsFile: "adminIndex.js",
        user: req.session.user,
        appointments: [],
        courses: [],
        eligibleTutorShifts: [],
        studentFName: "",
        studentLName: "",
        date: "",
        time: "",
        course: "",
        notificationLogs: []
      });
    }
    // ────────────────────────────────────────────────────────────

    // send cancellation notification email to student and CC admin
    try {
      await sendEmail({
        to: appointment.studentId.email,
        cc: process.env.GMAIL_ADMIN, // CC admin
        subject: "Appointment Cancellation",
        html: adminCancellationTemplate({
          studentName: appointment.studentId.fname,
          tutorName: `${appointment.tutorShiftId.tutorId.fname} ${appointment.tutorShiftId.tutorId.lname}`,
          date: appointment.appointmentDate.toLocaleDateString('en-US', { timeZone: 'UTC' }),
          time: `${appointment.startTime} - ${appointment.endTime}`,
          course: appointment.course
        })
      });

    } catch (emailErr) {
      console.error("Admin cancellation email sending error.");
    }

    return res.redirect("/adminIndex");
  } catch (err) {
    // render same page, with error message & empty arrays passed
    // to ensure page does not break
    res.render("adminIndex", {
      error: "Could not load appointments.",
      title: "Admin Page",
      cssStylesheet: "adminIndex.css",
      jsFile: "adminIndex.js",
      user: req.session.user,
      appointments: [],
      courses: [],
      // default form values
      eligibleTutorShifts: [],
      studentFName: "",
      studentLName: "",
      date: "",
      time: "",
      course: "",
      notificationLogs: []
    });
  }
};

// -------------------------------------------------------------------------------------------

// renders ADMIN AVAILABILITY INDEX
exports.getAdminAvailabilityIndex = async (req, res) => {
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

    // if auth user but not a admin, send to login page
    if (req.session.user.role !== "admin") {
      return res.render("login", {
        title: "Login Page",
        cssStylesheet: "login.css",
        jsFile: "login.js",
        error: "Access denied. Only admins can view this page.",
        user: null,
      });
    }

    const weekdays = await CenterOpen.find();

    res.render("adminAvailabilityIndex", {
      error: null,
      title: "Admin Availability",
      cssStylesheet: "availabilityIndex.css",
      jsFile: "adminAvailability.js",
      user: req.session.user,
      weekdays,
    });
  } catch (err) {
    res.render("adminAvailabilityIndex", {
      error: "Could not load page",
      title: "Admin Availability",
      cssStylesheet: "availabilityIndex.css",
      jsFile: "adminAvailability.js",
      user: req.session.user,
      weekdays: [],
    });
  }
};

// -------------------------------------------------------------------------------------------

// renders ADMIN TUTOR INDEX
exports.getAdminTutorIndex = async (req, res) => {
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

    // if auth user but not a admin, send to login page
    if (req.session.user.role !== "admin") {
      return res.render("login", {
        title: "Login Page",
        cssStylesheet: "login.css",
        jsFile: "login.js",
        error: "Access denied. Only admins can view this page.",
        user: null,
      });
    }
    // finding tutors in user collection
    const tutors = await User.find({ role: "tutor" });
    const activeTutors = await User.find({ role: "tutor", isActive: true });
    // retrieving courses (for when admin adds a tutor, they need to select the course(s) tutor will teach)
    const courses = await Course.find();
    const today = new Date().toLocaleDateString("en-CA");
    const centerSchedule = await CenterOpen.find();

    const weekdayMap = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    const closedWeekdays = [];

    centerSchedule.forEach((day) => {
      if (day.isClosed) {
        closedWeekdays.push(weekdayMap[day.weekday]);
      }
    });

    // open adminTutorIndex view
    res.render("adminTutorIndex", {
      error: null,
      title: "Admin Manage Tutors",
      cssStylesheet: "tutorIndex.css",
      jsFile: "tutorIndex.js",
      user: req.session.user,
      // passing data into view
      tutors,
      activeTutors,
      courses,
      today,
      // changed from "shifts: []"
      scheduleShifts: [],
      clearShifts: [],
      closedWeekdays,
      selectedTutorId: null,
      selectedShiftDate: "",
      availableShiftBlocks: [],
      openAssignTutorModal: false,
      openClearTutorModal: false,
      assignTutorError: null,
    });
  } catch (err) {
    const today = new Date().toLocaleDateString("en-CA");

    // even w/ error, page will still render
    res.render("adminTutorIndex", {
      error: "Could not load tutors.",
      title: "Admin Manage Tutors",
      cssStylesheet: "tutorIndex.css",
      jsFile: "tutorIndex.js",
      user: req.session.user,
      // passing empty array instead of tutor data for error
      tutors: [],
      activeTutors: [],
      courses: [],
      today,
      // changed from "shifts: []"
      scheduleShifts: [],
      clearShifts: [],
      closedWeekdays: [],
      selectedTutorId: null,
      selectedShiftDate: "",
      availableShiftBlocks: [],
      openAssignTutorModal: false,
      openClearTutorModal: false,
      assignTutorError: null,
    });
  }
};

// -------------------------------------------------------------------------------------------

// renders ADMIN AUDIT LOG

exports.getAdminAuditLog = async (req, res) => {
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

    // if auth user but not a admin, send to login page
    if (req.session.user.role !== "admin") {
      return res.render("login", {
        title: "Login Page",
        cssStylesheet: "login.css",
        jsFile: "login.js",
        error: "Access denied. Only admins can view this page.",
        user: null,
      });
    }

    const auditLogs = await AuditLog.find(
      {},
      "timestamp actionType details",
    ).sort({ timestamp: -1 });

    // render page
    res.render("adminAuditLog", {
      title: "Audit Log",
      cssStylesheet: "adminAuditLog.css",
      jsFile: "adminAuditLog.js",
      user: req.session.user,
      error: null,
      auditLogs,
    });
  } catch (err) {
    res.render("adminAuditLog", {
      title: "Audit Log",
      cssStylesheet: "adminAuditLog.css",
      jsFile: "adminAuditLog.js",
      user: req.session.user,
      error: "Failed to load",
      auditLogs: [],
    });
  }
};

// -------------------------------------------------------------------

// Changing a TUTOR'S STATUS FROM ACTIVE TO INACTIVE or vice versa
exports.toggleTutorStatus = async (req, res) => {
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

    // if auth user but not a admin, send to login page
    if (req.session.user.role !== "admin") {
      return res.render("login", {
        title: "Login Page",
        cssStylesheet: "login.css",
        jsFile: "login.js",
        error: "Access denied. Only admins can view this page.",
        user: null,
      });
    }
    // retrieving selected tutor ID from submitted form (selected Tutor)
    const tutorId = req.body.selectedTutor;
    const centerSchedule = await CenterOpen.find();

    const weekdayMap = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    const closedWeekdays = [];

    centerSchedule.forEach((day) => {
      if (day.isClosed) {
        closedWeekdays.push(weekdayMap[day.weekday]);
      }
    });

    // checks if tutor was selected -> security measure, if missing,
    // re-renders page and stops function
    if (!tutorId) {
      const tutors = await User.find({ role: "tutor" });
      const activeTutors = await User.find({ role: "tutor", isActive: true });
      const today = new Date().toLocaleDateString("en-CA");
      const courses = await Course.find();

      return res.render("adminTutorIndex", {
        // tells user to select tutor
        error: "Please select a tutor first.",
        title: "Admin Manage Tutors",
        cssStylesheet: "tutorIndex.css",
        jsFile: "tutorIndex.js",
        user: req.session.user,
        tutors,
        activeTutors,
        courses,
        today,
        closedWeekdays,
        selectedTutorId: req.body.tutorId || null,
        selectedShiftDate: req.body?.shiftDate || "",
        availableShiftBlocks: [],
        openAssignTutorModal: false,
        // changed from "shifts: []"
        scheduleShifts: [],
        clearShifts: [],
        openClearTutorModal: false,
        assignTutorError: null,
      });
    }

    // searching for one specific tutor, where role is tutor & id matches selected tutor
    const tutor = await User.findOne({ _id: tutorId, role: "tutor" });

    // if a matching tutor doesn't exist, return "not found" & stops function
    if (!tutor) {
      return res.status(404).render("adminTutorIndex", {
        error: "Tutor not found.",
        title: "Admin Manage Tutors",
        cssStylesheet: "tutorIndex.css",
        jsFile: "tutorIndex.js",
        user: req.session.user,
        tutors: [],
        activeTutors,
        courses: [],
        today,
        closedWeekdays: [],
        // changed from "shifts: []"
        scheduleShifts: [],
        clearShifts: [],
        selectedTutorId: req.body.tutorId || null,
        selectedShiftDate: req.body?.shiftDate || "",
        availableShiftBlocks: [],
        openAssignTutorModal: false,
        openClearTutorModal: false,
        assignTutorError: null,
      });
    }

    const newStatus = !tutor.isActive;

    // Finds tutor by Id/role
    // sets isActive to opposite of current value
    // await User.updateOne(
    //   { _id: tutorId, role: "tutor" },
    //   { $set: { isActive: !tutor.isActive } }
    // );

    await User.updateOne(
      { _id: tutorId, role: "tutor" },
      { $set: { isActive: newStatus } },
    );

    // audit log --> creating new log
    await AuditLog.create({
      actionUserId: req.session.user._id,
      actionType: "TUTOR_STATUS_CHANGED",
      targetUserId: tutor._id,
      details: `Tutor ${tutor.fname} ${tutor.lname} status set to ${newStatus ? "active" : "inactive"}.`,
    });

    // reloads page/show's updated active status
    return res.redirect("/adminTutorIndex");
  } catch (err) {
    const tutors = await User.find({ role: "tutor" });
    const courses = await Course.find();
    const activeTutors = await User.find({ role: "tutor", isActive: true });
    const today = new Date().toLocaleDateString("en-CA");

    res.render("adminTutorIndex", {
      error: "Could not update tutor status.",
      title: "Admin Manage Tutors",
      cssStylesheet: "tutorIndex.css",
      jsFile: "tutorIndex.js",
      user: req.session.user,
      tutors,
      activeTutors,
      courses,
      today,
      closedWeekdays: [],
      // changed from "shifts: []"
      scheduleShifts: [],
      clearShifts: [],
      selectedTutorId: req.body.tutorId || null,
      selectedShiftDate: req.body?.shiftDate || "",
      availableShiftBlocks: [],
      openAssignTutorModal: false,
      openClearTutorModal: false,
      assignTutorError: null,
    });
  }
};

// -------------------------------------------------------------------------------------------

// EDITING USER from admin
exports.editUser = async (req, res) => {
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

    // if auth user but not a admin, send to login page
    if (req.session.user.role !== "admin") {
      return res.render("login", {
        title: "Login Page",
        cssStylesheet: "login.css",
        jsFile: "login.js",
        error: "Access denied. Only admins can view this page.",
        user: null,
      });
    }

    // get data from what was entered in the modal
    const {
      fname,
      lname,
      email,
      password,
      confirmPassword,
      role,
      userId,
      isActive,
    } = req.body;
    let tutorCourses = [];

    // make sure all necessary fields were filled out
    if (!fname || !lname || !email || !role) {
      return res.status(400).render("adminAuditLog", {
        title: "Audit Log",
        error: "All fields are required.",
        cssStylesheet: "adminAuditLog.css",
        jsFile: "adminAuditLog.js",
        formData: req.body,
        user: req.session.user,
        auditLogs: [],
      });
    }

    // Security check to make sure that emails will not be dupliated
    // Checks all emails EXCEPT the current user email
    const existingUser = await User.findOne({
      email: email,
      _id: { $ne: userId },
    });
    if (existingUser) {
      return res.status(400).render("adminAuditLog", {
        title: "Audit Log",
        error: "A user with that email already exists.",
        cssStylesheet: "adminAuditLog.css",
        jsFile: "adminAuditLog.js",
        formData: req.body,
        user: req.session.user,
        auditLogs: [],
      });
    }

    // ensures email is entered in the form of @ilstu.edu
    const emailRegex = /^[^\s@]+@ilstu\.edu$/;
    if (!emailRegex.test(email)) {
      return res.status(400).render("adminAuditLog", {
        title: "Audit Log",
        error: "Email address not in the form of @ilstu.edu.",
        cssStylesheet: "adminAuditLog.css",
        jsFile: "adminAuditLog.js",
        formData: req.body,
        user: req.session.user,
        auditLogs: [],
      });
    }

    // checks to see if role is a tutor
    // if so, it populates the tutorCourses array with the courses that tutor teaches
    if (role === "tutor") {
      tutorCourses = req.body.tutorCourses;

      // making sure selected course(s) is turned into an array bc model expects
      // tutorCourses to be an array
      if (!Array.isArray(tutorCourses)) {
        tutorCourses = [tutorCourses];
      }

      if (tutorCourses.length === 0) {
        return res.status(400).render("adminAuditLog", {
          title: "Audit Log",
          error: "Course(s) must be selected to edit a tutor.",
          cssStylesheet: "adminAuditLog.css",
          jsFile: "adminAuditLog.js",
          formData: req.body,
          user: req.session.user,
          auditLogs: [],
        });
      }
    }

    // checks to see if password field is empty
    // IF the password field is NOT empty, hash new password
    // ELSE, keep the existing password by fetching it from the database

    // make sure password is at least 8 characters long
    if (password && password.trim() !== "" && password.length < 8) {
      return res.render("adminAuditLog", {
        title: "Audit Log",
        error: "Password must be at least 8 characters long.",
        cssStylesheet: "adminAuditLog.css",
        jsFile: "adminAuditLog.js",
        formData: req.body,
        user: req.session.user,
        auditLogs: [],
      });
    }

    let passwordHash;
    if (password && password.trim() !== "") {
      const saltRounds = 10;
      passwordHash = await bcrypt.hash(password, saltRounds);
    } else {
      const existingUser = await User.findById(userId);
      passwordHash = existingUser.passwordHash;
    }

    // when all above is passed/checked, edit user
    await User.findByIdAndUpdate(userId, {
      fname: fname,
      lname: lname,
      email: email,
      passwordHash: passwordHash,
      role: role,
      isActive: isActive === "true", // converts string "true"/"false" to boolean
      tutorCourses: tutorCourses,
    });

    // audit log --> creating new log
    await AuditLog.create({
      actionUserId: req.session.user._id,
      actionType: "USER_EDITED",
      targetUserId: userId,
      // logging user
      details: `User ${fname} ${lname} was edited. role: ${role}. status: ${isActive === "true" ? "active" : "inactive"}.`,
    });

    // redirect back to the correct page after editing the user
    if (role === "student") {
      return res.redirect("/adminStudentIndex");
    } else {
      return res.redirect("/adminTutorIndex");
    }
  } catch (err) {
    // in case of any errors, can log them and 500 for unfulfilled req
    return res.status(500).render("adminAuditLog", {
      title: "Audit Log",
      error: "Could not edit user",
      cssStylesheet: "adminAuditLog.css",
      jsFile: "adminAuditLog.js",
      formData: req.body,
      user: req.session.user,
      auditLogs: [],
    });
  }
};

// -----------------------------------------

// handling submitted form data for ASSIGNING TUTOR HOURS
exports.assignTutorHours = async (req, res) => {
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

    // if auth user but not a admin, send to login page
    if (req.session.user.role !== "admin") {
      return res.render("login", {
        title: "Login Page",
        cssStylesheet: "login.css",
        jsFile: "login.js",
        error: "Access denied. Only admins can view this page.",
        user: null,
      });
    }

    // retrieve info entered from form
    const { tutorId, shiftDate, action } = req.body;
    // get shiftBlocks chosen by admin (checkbox)
    let { shiftBlocks } = req.body;
    let today = new Date().toLocaleDateString("en-CA");
    const centerSchedule = await CenterOpen.find();
    // for audit log to print the assigned shifts
    const assignedShiftTimes = [];

    // for flatpickr (for disabling days to choose from)-> creates mapping between the weekday names & their number
    const weekdayMap = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    const closedWeekdays = [];

    centerSchedule.forEach((day) => {
      if (day.isClosed) {
        // pushing which weekdays are closed (converts weekday name to its js number, adds to list of closed days)
        closedWeekdays.push(weekdayMap[day.weekday]);
      }
    });

    // page data
    const tutors = await User.find({ role: "tutor" });
    const activeTutors = await User.find({ role: "tutor", isActive: true });
    const courses = await Course.find();

    // ensure all required form fields were submitted
    if (!tutorId || !shiftDate) {
      //re-render the page
      return res.render("adminTutorIndex", {
        error: "All fields are required",
        title: "Admin Manage Tutors",
        cssStylesheet: "tutorIndex.css",
        jsFile: "tutorIndex.js",
        user: req.session.user,
        tutors,
        activeTutors,
        courses,
        today,
        closedWeekdays,
        selectedTutorId: tutorId || null,
        selectedShiftDate: shiftDate || "",
        availableShiftBlocks: [],
        openAssignTutorModal: false,
        // changed from "shifts: []"
        scheduleShifts: [],
        clearShifts: [],
        assignTutorError: null,
      });
    } // end of if(!tutorId || !shiftDate etc...)

    // make sure selected tutor exists in db & has tutor role
    const tutor = await User.findOne({ _id: tutorId, role: "tutor" });

    // if tutor was not found
    if (!tutor) {
      return res.render("adminTutorIndex", {
        error: "Tutor not found",
        title: "Admin Manage Tutors",
        cssStylesheet: "tutorIndex.css",
        jsFile: "tutorIndex.js",
        user: req.session.user,
        tutors,
        activeTutors,
        courses,
        today,
        closedWeekdays,
        selectedTutorId: tutorId || null,
        selectedShiftDate: shiftDate || "",
        availableShiftBlocks: [],
        openAssignTutorModal: false,
        // changed from "shifts: []"
        scheduleShifts: [],
        clearShifts: [],
        assignTutorError: null,
      });
    } // end of if(!tutor)

    // convert submitted shift date string into js date object
    // map(Number) to convert each item in array to number
    const [year, month, day] = shiftDate.split("-").map(Number);

    // "month - 1" --> subtract 1 because JavaScript months are 0-indexed (0 = January)
    // form gives 03 (March), need to pass 2 in new date for finding weekday
    const selectedDate = new Date(year, month - 1, day);



    // create exact start/end of selected day
    const start = new Date(year, month - 1, day, 0, 0, 0, 0);
    const end = new Date(year, month - 1, day, 23, 59, 59, 999);

    // check whether selected date falls within any blackout date range
    const blackoutDate = await centerClosedSchedule.findOne({
      startDate: { $lte: end },
      endDate: { $gte: start }
    });

    if (blackoutDate) {
      return res.render("adminTutorIndex", {
        error: null,
        title: "Admin Manage Tutors",
        cssStylesheet: "tutorIndex.css",
        jsFile: "tutorIndex.js",
        user: req.session.user,
        tutors,
        activeTutors,
        courses,
        today,
        closedWeekdays,
        selectedTutorId: tutorId || null,
        selectedShiftDate: shiftDate || "",
        availableShiftBlocks: [],
        openAssignTutorModal: true,
        scheduleShifts: [],
        clearShifts: [],
        openClearTutorModal: false,
        assignTutorError: `The center is closed due to blackout date. Tutor shifts cannot be assigned.`,
      });
    }




    // determine weekday name from selected date
    const weekdayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    // getDay() returns day of WEEK
    // determine weekday name for selected shift date
    const weekday = weekdayNames[selectedDate.getDay()];

    // find normal center open hours for that weekday
    const centerOpenDay = await CenterOpen.findOne({ weekday });

    // if center is fully closed that weekday, shift creation not allowed
    if (!centerOpenDay || centerOpenDay.isClosed) {
      return res.render("adminTutorIndex", {
        // returning an error that the center is closed that day/shifts can't be scheduled
        error: `Center is closed on ${weekday}; shifts cannot be scheduled`,
        title: "Admin Manage Tutors",
        cssStylesheet: "tutorIndex.css",
        jsFile: "tutorIndex.js",
        user: req.session.user,
        tutors,
        activeTutors,
        courses,
        today,
        closedWeekdays,
        selectedTutorId: tutorId || null,
        selectedShiftDate: shiftDate || "",
        availableShiftBlocks: [],
        openAssignTutorModal: false,
        // changed from "shifts: []"
        scheduleShifts: [],
        clearShifts: [],
        assignTutorError: null,
      });
    }

    // split center open/close times into hour/minute pieces (need to compare as full hour blocks for
    // tutor scheduling)
    const centerOpenHr = parseInt(centerOpenDay.openTime.split(":")[0], 10);
    const centerOpenMin = parseInt(centerOpenDay.openTime.split(":")[1], 10);
    // same for close hour
    const centerCloseHr = parseInt(centerOpenDay.closeTime.split(":")[0], 10);

    // determine the first FULL-hour block the center can use
    // ex: if center opens at 12:35, can't schedule a shift block from 12:00 - 14:00 --> need to schedule
    // from 13:00 - 14:00 (won't schedule "partial" shifts/minutes)
    let validStartHr;

    if (centerOpenMin === 0) {
      validStartHr = centerOpenHr;
    } else {
      validStartHr = centerOpenHr + 1;
    }

    // determine last hour the center can use for shift scheduling
    let validEndHr = centerCloseHr;

    // if no valid hour block is available for admin to schedule
    if (validStartHr >= validEndHr) {
      return res.render("adminTutorIndex", {
        // returning an error that the center is closed that day/shifts can't be scheduled
        error:
          "No full 1-hour shifts are available for the date and tutor selected",
        title: "Admin Manage Tutors",
        cssStylesheet: "tutorIndex.css",
        jsFile: "tutorIndex.js",
        user: req.session.user,
        tutors,
        activeTutors,
        courses,
        today,
        closedWeekdays,
        // changed from "shifts: []"
        scheduleShifts: [],
        clearShifts: [],
        selectedTutorId: tutorId,
        selectedShiftDate: shiftDate,
        openAssignTutorModal: true,
        availableShiftBlocks: [],
        assignTutorError: null,
      });
    }

    // converting 24hr format to 12hr format with the am and pm labels
    function formatTo12Hour(timeStr) {
      const [hourStr, minute] = timeStr.split(":");
      let hour = parseInt(hourStr, 10);
      const ampm = hour >= 12 ? "PM" : "AM";

      hour = hour % 12;
      if (hour === 0) hour = 12;

      return `${hour}:${minute} ${ampm}`;
    }

    // finding existing tutor Shifts for specified chosen date
    // log
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    const existingTutorShifts = await TutorShift.find({
      tutorId: tutorId,
      shiftDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    // fetching the partial closures (exception blocks) for the specified day admin wants to assign hours
    const exceptionBlocks = await CenterException.find({
      exceptionDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).sort({ startTime: 1 });

    // log new Set
    const takenShiftBlocks = new Set();

    // loop through all shifts tutor already has scheduled for that day
    existingTutorShifts.forEach((shift) => {
      takenShiftBlocks.add(`${shift.startTime}-${shift.endTime}`);
    });

    const exceptionShiftBlocks = new Set();

    exceptionBlocks.forEach((block) => {
    const startHr = parseInt(block.startTime.split(":")[0], 10);
    const endHr = parseInt(block.endTime.split(":")[0], 10);

    for (let hour = startHr; hour < endHr; hour++) {
      const blockStart = `${String(hour).padStart(2, "0")}:00`;
      const blockEnd = `${String(hour + 1).padStart(2, "0")}:00`;
      exceptionShiftBlocks.add(`${blockStart}-${blockEnd}`);
    }
  });

    const availableShiftBlocks = [];

    // loop through each hr between the center open/and the close time
    for (let hour = validStartHr; hour < validEndHr; hour++) {
      const blockStart = `${String(hour).padStart(2, "0")}:00`;
      const blockEnd = `${String(hour + 1).padStart(2, "0")}:00`;
      const blockValue = `${blockStart}-${blockEnd}`;

      // only display shift block IF tutor does NOT already have it scheduled for them 
      // & UPDATED display shift block IF it is not time-blocked off 
      if (!takenShiftBlocks.has(blockValue) && !exceptionShiftBlocks.has(blockValue)) {
        availableShiftBlocks.push({
          value: blockValue,
          label: `${formatTo12Hour(blockStart)} - ${formatTo12Hour(blockEnd)}`,
        });
      }
    }


    // if there are NO available shift blocks, 
    // describe that center is closed or shifts are taken
    if (availableShiftBlocks.length === 0) {
      return res.render("adminTutorIndex", {
        error: null,
        title: "Admin Manage Tutors",
        cssStylesheet: "tutorIndex.css",
        jsFile: "tutorIndex.js",
        user: req.session.user,
        tutors,
        activeTutors,
        courses,
        today,
        closedWeekdays,
        selectedTutorId: tutorId,
        selectedShiftDate: shiftDate,
        availableShiftBlocks: [],
        openAssignTutorModal: true,
        scheduleShifts: [],
        clearShifts: [],
        openClearTutorModal: false,
        assignTutorError: "No tutor shifts are available for that date. The center is closed during the remaining hours, or the shifts are already taken.",
      });
    }

    // view button
    if (action === "view") {
      return res.render("adminTutorIndex", {
        error: null,
        title: "Admin Manage Tutors",
        cssStylesheet: "tutorIndex.css",
        jsFile: "tutorIndex.js",
        user: req.session.user,
        tutors,
        activeTutors,
        courses,
        today,
        closedWeekdays,
        selectedTutorId: tutorId,
        selectedShiftDate: shiftDate,
        availableShiftBlocks,
        openAssignTutorModal: true,
        // changed from "shifts: []"
        scheduleShifts: [],
        clearShifts: [],
        openClearTutorModal: false,
        assignTutorError: null,
      });
    }
    // assign button
    if (action === "assign") {
      // no boxes are checked for shifts
      if (!shiftBlocks) {
        return res.render("adminTutorIndex", {
          error: "Please select at least one shift block,",
          title: "Admin Manage Tutors",
          cssStylesheet: "tutorIndex.css",
          jsFile: "tutorIndex.js",
          user: req.session.user,
          tutors,
          activeTutors,
          courses,
          today,
          closedWeekdays,
          selectedTutorId: tutorId,
          selectedShiftDate: shiftDate,
          availableShiftBlocks,
          openAssignTutorModal: true,
          // changed from "shifts: []"
          scheduleShifts: [],
          clearShifts: [],
          openClearTutorModal: false,
          assignTutorError: null,
        });
      }

      // Make sure the shiftBlocks is an array
      if (!Array.isArray(shiftBlocks)) {
        shiftBlocks = [shiftBlocks];
      }

      // count for how many of the shifts ar created & skipped(ignored)
      let createdCount = 0;
      let skippedCount = 0;

      // loop through the selected shifts
      for (const block of shiftBlocks) {
        const [startTime, endTime] = block.split("-");

        // make sure the startTime and the endTime of the shift block(s) exist
        // validation check !
        if (!startTime || !endTime) {
          skippedCount++;
          continue;
        }

        // split the times into hr & minute pieces
        const [startHrStr, startMinStr] = startTime.split(":");
        const [endHrStr, endMinStr] = endTime.split(":");

        // convert the strings to numers
        const startHr = parseInt(startHrStr, 10);
        const endHr = parseInt(endHrStr, 10);
        const startMin = parseInt(startMinStr, 10);
        const endMin = parseInt(endMinStr, 10);

        // ensure minutes are zero (that hours are on the block)
        if (startMin !== 0 || endMin !== 0) {
          skippedCount++;
          continue;
        }

        // making sure chosen blocks are one-hour blocks
        if (endHr !== startHr + 1) {
          skippedCount++;
          continue;
        }

        //make sure block is inside available (center open) range
        if (startHr < validStartHr || endHr > validEndHr) {
          skippedCount++;
          continue;
        }

        // make sure blocked center hours cannot be assigned
        if (exceptionShiftBlocks.has(block)) {
        skippedCount++;
        continue;
      }
        // validation check for dpublicate shifts (making sure duplicates are not chosen)
        const existingShift = await TutorShift.findOne({
          tutorId,
          shiftDate: selectedDate,
          startTime,
          endTime,
        });

        // if shift to be added already exists, skip
        if (existingShift) {
          skippedCount++;
          continue;
        }

        await TutorShift.create({
          tutorId,
          assignedByAdminId: req.session.user._id,
          shiftDate: selectedDate,
          startTime,
          endTime,
        });

        // collecting the shift times for audit log
        assignedShiftTimes.push(
          `${formatTo12Hour(startTime)} - ${formatTo12Hour(endTime)}`,
        );

        createdCount++;
      }

      // audit log (AFTER loop --> collected the shifts assigned, passing them into details to show exactly which shifts were assigned)
      if (assignedShiftTimes.length > 0) {
        await AuditLog.create({
          actionUserId: req.session.user._id,
          actionType: "TUTOR_SHIFT_ASSIGNED",
          targetUserId: tutor._id,
          details: `Tutor ${tutor.fname} ${tutor.lname} was assigned shifts on ${shiftDate}: ${assignedShiftTimes.join(", ")}.`,
        });
      }

      return res.render("adminTutorIndex", {
        error: null,
        title: "Admin Manage Tutors",
        cssStylesheet: "tutorIndex.css",
        jsFile: "tutorIndex.js",
        user: req.session.user,
        tutors,
        activeTutors,
        courses,
        today,
        closedWeekdays,
        selectedTutorId: tutorId,
        selectedShiftDate: shiftDate,
        availableShiftBlocks,
        openAssignTutorModal: false,
        // changed from "shifts: []"
        scheduleShifts: [],
        clearShifts: [],
        openClearTutorModal: false,
        assignTutorError: null,
      });

      // add fallback(?)
    }
  } catch (err) {
    //end of try
    const tutors = await User.find({ role: "tutor" });
    const courses = await Course.find();
    const today = new Date().toLocaleDateString("en-CA");
    const activeTutors = await User.find({ role: "tutor", isActive: true });

    // render page with general error message
    res.render("adminTutorIndex", {
      error: "Could not assign tutor shifts.",
      title: "Admin Manage Tutors",
      cssStylesheet: "tutorIndex.css",
      jsFile: "tutorIndex.js",
      user: req.session.user,
      tutors,
      activeTutors,
      courses,
      today,
      closedWeekdays: [],
      // changed from "shifts: []"
      scheduleShifts: [],
      clearShifts: [],
      openAssignTutorModal: false,
      selectedTutorId: req.body.tutorId || null,
      selectedShiftDate: req.body?.shiftDate || "",
      availableShiftBlocks: [],
      openClearTutorModal: false,
      assignTutorError: null,
    });
  } // end of catch
};

// -------------------------------------------------------------------------------------------

//POST: show tutor's scheduled shifts after admin selects tutor
exports.adminViewTutorShedule = async (req, res) => {
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

    // if auth user but not a admin, send to login page
    if (req.session.user.role !== "admin") {
      return res.render("login", {
        title: "Login Page",
        cssStylesheet: "login.css",
        jsFile: "login.js",
        error: "Access denied. Only admins can view this page.",
        user: null,
      });
    }

    const tutorId = req.body.tutorId || req.body.selectedTutor;
    const centerSchedule = await CenterOpen.find();

    const weekdayMap = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    const closedWeekdays = [];

    centerSchedule.forEach((day) => {
      if (day.isClosed) {
        closedWeekdays.push(weekdayMap[day.weekday]);
      }
    });

    //if the user did not select a tutor first, return an error message
    if (!tutorId) {
      return res.status(400).render("adminTutorIndex", {
        error: "Tutor ID is required.",
        shiftError,
        title: "Admin Manage Tutors",
        cssStylesheet: "tutorIndex.css",
        jsFile: "tutorIndex.js",
        user: req.session.user,
        tutors,
        activeTutors,
        courses,
        today,
        // changed from "shifts, "
        scheduleShifts: shifts,
        clearShifts: [],
        closedWeekdays,
        selectedTutorId: req.body.tutorId || null,
        selectedShiftDate: req.body?.shiftDate || "",
        availableShiftBlocks: [],
        openAssignTutorModal: false,
        openClearTutorModal: false,
        assignTutorError: null,
      });
    }

    //get the shifts for the selected tutor
    const tutorObjectId = new mongoose.Types.ObjectId(tutorId);
    // function to get all shifts for the tutor and sort by date and time
    let shifts = [];
    let shiftError = null;
    try {
      shifts = await getTutorShifts(tutorObjectId);
    } catch (err) {
      shiftError = "Failed to load tutor shifts.";
    }

    // Load data needed to render the main tutor management page with the selected tutor's shifts
    const tutors = await User.find({ role: "tutor" });
    const activeTutors = await User.find({ role: "tutor", isActive: true });
    const courses = await Course.find();
    const today = new Date().toISOString().split("T")[0];

    res.render("adminTutorIndex", {
      error: null,
      shiftError,
      title: "Admin Manage Tutors",
      cssStylesheet: "tutorIndex.css",
      jsFile: "tutorIndex.js",
      user: req.session.user,
      tutors,
      activeTutors,
      courses,
      today,
      // changed from "shifts, "
      scheduleShifts: shifts,
      clearShifts: [],
      closedWeekdays,
      selectedTutorId: req.body.tutorId || null,
      selectedShiftDate: req.body?.shiftDate || "",
      availableShiftBlocks: [],
      openAssignTutorModal: false,
      openClearTutorModal: false,
      assignTutorError: null,
    });
  } catch (err) {
    res.render("adminTutorIndex", {
      error: "Could not load tutor shifts.",
      shiftError: null,
      title: "Admin Manage Tutors",
      cssStylesheet: "tutorIndex.css",
      jsFile: "tutorIndex.js",
      user: req.session.user,
      tutors: [],
      activeTutors: [],
      courses: [],
      today: new Date().toISOString().split("T")[0],
      // changed from "shifts: []"
      scheduleShifts: [],
      clearShifts: [],
      closedWeekdays: [],
      selectedTutorId: req.body.tutorId || null,
      selectedShiftDate: req.body?.shiftDate || "",
      availableShiftBlocks: [],
      openAssignTutorModal: false,
      openClearTutorModal: false,
      assignTutorError: null,
    });
  }
};

// -----------------------------------------------------------------------------------------------------

// try to get the tutor's shifts, if error occurs render page with error message and empty shifts array
async function getTutorShifts(theTutorId) {
  try {
    const tutorShifts = await TutorShift.aggregate([
      {
        $match: {
          // filter shifts to only the tutor's shifts
          tutorId: theTutorId,
        },
      },
      {
        $lookup: {
          // join with user collection to get tutor's name for display
          from: "users",
          localField: "tutorId",
          foreignField: "_id",
          as: "tutor",
        },
      },
      { $unwind: "$tutor" },
      { $sort: { shiftDate: 1, startTime: 1 } }, // sort by date and time
    ]);

    // if there are no shifts found for the tutor, return an empty array
    if (!tutorShifts || tutorShifts.length === 0) {
      return [];
    }
    return groupNonconsecutiveShifts(tutorShifts);
  } catch (err) {
    throw err;
  }
}

// helper function to group nonconsecutive shifts since tutors can be scheduled for multiple time blocks on the same day i.e. 11-2 pm and 4-6 pm on the same day
// first groups shifts by date, then merges consecutive tutorShifts into the one time range, and returns an array of objects with the tutorId, shiftDate, and an array of time ranges for that day
function groupNonconsecutiveShifts(shifts) {
  const map = new Map();

  for (const shift of shifts) {
    const dateKey = new Date(shift.shiftDate).toDateString();

    if (!map.has(dateKey)) {
      map.set(dateKey, {
        tutorId: shift.tutorId,
        tutorName:
          shift.tutor?.fname + " " + shift.tutor?.lname || "Unknown Tutor",
        shiftDate: shift.shiftDate,
        timeRanges: [],
      });
    }

    const group = map.get(dateKey);
    const lastRange = group.timeRanges[group.timeRanges.length - 1];

    // if lastRange exists and if the end time of the last range matches the start time of the current shift,
    // it is consecutive and extend the last group end time to the current shift end time
    // otherwise, add a new time range to the group for the current shift
    if (lastRange && lastRange.shiftEnd === shift.startTime) {
      lastRange.shiftEnd = shift.endTime;
    } else {
      group.timeRanges.push({
        shiftStart: shift.startTime,
        shiftEnd: shift.endTime,
      });
    }
  }

  return Array.from(map.values());
}

// -------------------------------------------------------------------------------------------

// REMOVING ALL TUTOR SHIFTS from specified day (/clearing tutor hours)
exports.clearTutorHours = async (req, res) => {
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

    // if auth user but not a admin, send to login page
    if (req.session.user.role !== "admin") {
      return res.render("login", {
        title: "Login Page",
        cssStylesheet: "login.css",
        jsFile: "login.js",
        error: "Access denied. Only admins can view this page.",
        user: null,
      });
    }
    // retrieving tutorId and shiftDate chosen by admin
    const { tutorId, shiftDate, action } = req.body;
    let { selectedShiftIds } = req.body;
    // fetching tutorId for auditLog (so name can be displayed)
    const tutor = tutorId
      ? await User.findOne({ _id: tutorId, role: "tutor" })
      : null;

    const tutors = await User.find({ role: "tutor" });
    const activeTutors = await User.find({ role: "tutor", isActive: true });
    const courses = await Course.find();
    const today = new Date().toLocaleDateString("en-CA");
    const centerSchedule = await CenterOpen.find();

    const weekdayMap = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    const closedWeekdays = [];

    centerSchedule.forEach((day) => {
      if (day.isClosed) {
        closedWeekdays.push(weekdayMap[day.weekday]);
      }
    });

    if (!tutorId || !shiftDate) {
      return res.render("adminTutorIndex", {
        error: "Please select a tutor and date first.",
        title: "Admin Manage Tutors",
        cssStylesheet: "tutorIndex.css",
        jsFile: "tutorIndex.js",
        user: req.session.user,
        tutors,
        activeTutors,
        courses,
        today,
        closedWeekdays,
        // changed from "ClearShifts: shifts,"
        scheduleShifts: [],
        clearShifts: [],
        selectedTutorId: req.body.tutorId || null,
        selectedShiftDate: req.body?.shiftDate || "",
        availableShiftBlocks: [],
        openAssignTutorModal: false,
        openClearTutorModal: true,
        assignTutorError: null,
      });
    }

    // prase selected date
    const [year, month, day] = shiftDate.split("-").map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
    const nextDay = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

    // viewing the active shifts
    if (action === "view") {
      // function for viewing the tutor hours to clear in 12-hr format instead of military time
      function formatTo12Hour(timeStr) {
        const [hourStr, minute] = timeStr.split(":");
        let hour = parseInt(hourStr, 10);
        const ampm = hour >= 12 ? "PM" : "AM";

        hour = hour % 12;
        if (hour === 0) hour = 12;

        return `${hour}:${minute} ${ampm}`;
      }

      // retrieving the tutor shifts and formatting them 12-hr format
      // formatting them in controller --> when I tried to format in ejs, it affected the flatpickr/safest way here
      const shifts = (
        await TutorShift.find({
          tutorId,
          shiftDate: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
        }).sort({ startTime: 1 })
      ).map((shift) => ({
        ...shift.toObject(),
        startTime: formatTo12Hour(shift.startTime),
        endTime: formatTo12Hour(shift.endTime),
      }));

      return res.render("adminTutorIndex", {
        error: null,
        title: "Admin Manage Tutors",
        cssStylesheet: "tutorIndex.css",
        jsFile: "tutorIndex.js",
        user: req.session.user,
        tutors,
        activeTutors,
        courses,
        today,
        closedWeekdays,
        // changed from "shifts,"
        scheduleShifts: [],
        clearShifts: shifts,
        selectedTutorId: req.body.tutorId || null,
        selectedShiftDate: req.body?.shiftDate || "",
        availableShiftBlocks: [],
        openAssignTutorModal: false,
        openClearTutorModal: true,
        assignTutorError: null,
      });
    }

    // remove the checked shifts
    if (action === "removeSelected") {
      if (!selectedShiftIds) {
        const shifts = await TutorShift.find({
          tutorId,
          shiftDate: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        }).sort({ startTime: 1 });

return res.render("adminTutorIndex", {
        error: "Select at least one shift to remove", 
        title: "Admin Manage Tutors",
        cssStylesheet: "tutorIndex.css",
        jsFile: "tutorIndex.js",
        user: req.session.user,
        tutors,
        activeTutors,
        courses,
        today,
        closedWeekdays,
        //changed from "shifts,"
        scheduleShifts: [],
        clearShifts: shifts,
        selectedTutorId: req.body.tutorId || null,
        selectedShiftDate: req.body?.shiftDate || "",
        availableShiftBlocks: [],
        openAssignTutorModal: false,
        openClearTutorModal: true,
        assignTutorError: null,
      });
    } // end of if (!selectedShiftIds)



    if(!Array.isArray(selectedShiftIds)){
      selectedShiftIds = [selectedShiftIds];
    }

    // helper function (12-hr formatting)
    function formatTo12Hour(time){
      const [hourStr, minute] = time.split(":");
      let hour = parseInt(hourStr, 10);
      const ampm = hour >= 12 ? "PM" : "AM";

      hour = hour % 12; 
      if( hour === 0 ) hour = 12; 
      
      return `${hour}:${minute} ${ampm}`;
    }

    // retrive shifts before deleting them 
    const shiftsToRemove = await TutorShift.find({
      _id: { $in: selectedShiftIds },
      tutorId, 
      shiftDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ startTime: 1 });

// shift time string (for audit log) 
const removedShiftTimes = shiftsToRemove.map(shift => {
  return `${formatTo12Hour(shift.startTime)} - ${formatTo12Hour(shift.endTime)}`;
}).join(", ");



    const removedShifts = await TutorShift.deleteMany({
    // const removedShifts = await TutorShift.deleteMany({
      _id: { $in: selectedShiftIds },
      tutorId, 
      shiftDate: {
        $gte: startOfDay, 
        $lte: endOfDay,
      },
    });

    
// double-checking removedShifts is greater than 0, then logging 
    if(removedShifts.deletedCount > 0){
      await AuditLog.create({
      actionUserId: req.session.user._id,
      actionType: "TUTOR_SHIFT_REMOVED",
      targetUserId: tutor._id,
      details: `Tutor ${tutor.fname} ${tutor.lname} was removed from shifts on ${shiftDate}: ${removedShiftTimes}.`
    });
    }



    return res.redirect("/adminTutorIndex");
  } // end of remove checked shifts


    // clearing full selected day
    if (action === "clearAll") {
      
    // helper function (12-hr formatting)
    function formatTo12Hour(time){
      const [hourStr, minute] = time.split(":");
      let hour = parseInt(hourStr, 10);
      const ampm = hour >= 12 ? "PM" : "AM";

      hour = hour % 12; 
      if( hour === 0 ) hour = 12; 
      
      return `${hour}:${minute} ${ampm}`;
    }


      const shiftsToClear = await TutorShift.find({
        tutorId,
        shiftDate: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      }).sort({ startTime: 1 });



      if (shiftsToClear.length === 0) {
        return res.render("adminTutorIndex", {
          error:
            `No shift assigned for this tutor on ${shiftDate}; no shifts removed.`,
          title: "Admin Manage Tutors",
          cssStylesheet: "tutorIndex.css",
          jsFile: "tutorIndex.js",
          user: req.session.user,
          tutors,
          activeTutors,
          courses,
          today,
          closedWeekdays,
          // changed from "shifts: []"
          scheduleShifts: [],
          clearShifts: [],
          selectedTutorId: req.body.tutorId || null,
          selectedShiftDate: req.body?.shiftDate || "",
          availableShiftBlocks: [],
          openAssignTutorModal: false,
          openClearTutorModal: true,
          assignTutorError: null,
        });
      }

      // shift time string (for audit log) 
    const clearedShifts = shiftsToClear.map(shift => {
      return `${formatTo12Hour(shift.startTime)} - ${formatTo12Hour(shift.endTime)}`;
    }).join(", ");


    const deletedShifts = await TutorShift.deleteMany({
      tutorId,
      shiftDate: {
        $gte: startOfDay, 
        $lte: endOfDay
      },
    });


    if (deletedShifts.deletedCount > 0){
      await AuditLog.create({
        actionUserId: req.session.user._id, 
        actionType: "TUTOR_SHIFT_REMOVED",
        targetUserId: tutor._id, 
        details: `Tutor ${tutor.fname} ${tutor.lname} was removed from ALL shifts on ${shiftDate}: ${clearedShifts}.`,
      });
    }


      return res.redirect("/adminTutorIndex");

    } // clearing full selected day func

  } catch (err) {
    const closedWeekdays = [];
    const tutors = await User.find({ role: "tutor" });
    const activeTutors = await User.find({ role: "tutor", isActive: true });
    const courses = await Course.find();
    const today = new Date().toLocaleDateString("en-CA");

    return res.render("adminTutorIndex", {
      error: "Could not clear tutor hours",
      title: "Admin Manage Tutors",
      cssStylesheet: "tutorIndex.css",
      jsFile: "tutorIndex.js",
      user: req.session.user,
      tutors,
      activeTutors,
      courses,
      today,
      closedWeekdays,
      // changed from "shifts: [],"
      scheduleShifts: [],
      clearShifts: [],
      selectedTutorId: req.body.tutorId || null,
      selectedShiftDate: req.body?.shiftDate || "",
      availableShiftBlocks: [],
      openAssignTutorModal: false,
      openClearTutorModal: true,
      assignTutorError: null,
    });
  }
}; 

// --------------------------------------------------------------------------------------------

// RENDERS ADMIN STUDENT INDEX
exports.getAdminStudentIndex = async (req, res) => {
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

    // if auth user but not a admin, send to login page
    if (req.session.user.role !== "admin") {
      return res.render("login", {
        title: "Login Page",
        cssStylesheet: "login.css",
        jsFile: "login.js",
        error: "Access denied. Only admins can view this page.",
        user: null,
      });
    }
    // retrieving students from user collection
    const students = await User.find({ role: "student" });
    res.render("adminStudentIndex", {
      error: null,
      title: "Admin Manage Students",
      cssStylesheet: "studentIndex.css",
      jsFile: "studentIndex.js",
      user: req.session.user,
      // pass list of students into view
      students: students,
    });
  } catch (err) {
    res.render("adminStudentIndex", {
      error: "Could not load students",
      title: "Admin Manage Students",
      cssStylesheet: "studentIndex.css",
      jsFile: "studentIndex.js",
      user: req.session.user,
      // empty array when error occurs
      students: [],
    });
  }
};

// -------------------------------------------------------------------------------------------

// Changing a STUDENT'S STATUS FROM ACTIVE TO INACTIVE or vice versa
exports.toggleStudentStatus = async (req, res) => {
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

    // if auth user but not a admin, send to login page
    if (req.session.user.role !== "admin") {
      return res.render("login", {
        title: "Login Page",
        cssStylesheet: "login.css",
        jsFile: "login.js",
        error: "Access denied. Only admins can view this page.",
        user: null,
      });
    }
    // retrieving selected student ID from submitted form (this is from the radio button "SelectedStudent")
    const studentId = req.body.selectedStudent;

    // if a student is not selected (no Id retrived), re-render page -> makes sure undefined id's are updated
    if (!studentId) {
      const students = await User.find({ role: "student" });

      return res.render("adminStudentIndex", {
        error: "Please select a student first.",
        title: "Admin Manage Students",
        cssStylesheet: "studentIndex.css",
        jsFile: "studentIndex.js",
        user: req.session.user,
        students: students,
      });
    }

    // finding the selected user (student) by their id and role
    const student = await User.findOne({
      _id: studentId,
      role: "student",
    });

    // Makes sure student exists in db
    if (!student) {
      return res.status(404).render("adminStudentIndex", {
        error: "Student not found.",
        title: "Admin Manage Students",
        cssStylesheet: "studentIndex.css",
        jsFile: "studentIndex.js",
        user: req.session.user,
        students: [],
      });
    }

    const newStatus = !student.isActive;

    // Toggle the students isActive value / update it
    await User.updateOne(
      { _id: studentId, role: "student" },
      { $set: { isActive: newStatus } },
    );

    // audit log for changing student status
    await AuditLog.create({
      actionUserId: req.session.user._id,
      actionType: "STUDENT_STATUS_CHANGED",
      targetUserId: student._id,
      details: `Student ${student.fname} ${student.lname} status set to ${newStatus ? "active" : "inactive"}.`,
    });

    // re-renders updated list (active vs. inactive) and redirects to the manage students page
    res.redirect("/adminStudentIndex");
  } catch (err) {
    // in case of any erros, can log them and 500 for unfulfilled req

    const students = await User.find({ role: "student" });

    res.render("adminStudentIndex", {
      error: "Could not update student status.",
      title: "Admin Manage Students",
      cssStylesheet: "studentIndex.css",
      jsFile: "studentIndex.js",
      user: req.session.user,
      students,
    });
  }
};

// -------------------------------------------------------------------------------------------

// ADDING NEW USER (student/tutor)from admin
exports.addUser = async (req, res) => {
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

    // if auth user but not a admin, send to login page
    if (req.session.user.role !== "admin") {
      return res.render("login", {
        title: "Login Page",
        cssStylesheet: "login.css",
        jsFile: "login.js",
        error: "Access denied. Only admins can view this page.",
        user: null,
      });
    }
    // get data from what was entered in the modal
    const { fname, lname, email, password, confirmPassword, role, sourcePage } =
      req.body;
    const tutors = await User.find({ role: "tutor" });
    const users = await User.find();
    const courses = await Course.find();
    const activeTutors = await User.find({ role: "tutor", isActive: true });
    const today = new Date().toLocaleDateString("en-CA");

    let { tutorCourses } = req.body;

    // make sure all fields were filled out
    if (!fname || !lname || !email || !password || !confirmPassword || !role) {
      return res.status(400).render("adminAuditLog", {
        title: "Audit Log",
        error: "All fields are required.",
        cssStylesheet: "adminAuditLog.css",
        jsFile: "adminAuditLog.js",
        formData: req.body,
        user: req.session.user,
        auditLogs: [],
      });
    }

    // ensures email is entered in the form of @ilstu.edu
    const emailRegex = /^[^\s@]+@ilstu\.edu$/;
    if (!emailRegex.test(email)) {
      return res.render("adminAuditLog", {
        title: "Audit Log",
        error: "Email address not in the form of @ilstu.edu.",
        cssStylesheet: "adminAuditLog.css",
        jsFile: "adminAuditLog.js",
        formData: req.body,
        user: req.session.user,
        auditLogs: [],
      });
    }

    // make sure password is at least 8 characters long
    if (password.length < 8) {
      return res.render("adminAuditLog", {
        title: "Audit Log",
        error: "Password must be at least 8 characters long.",
        cssStylesheet: "adminAuditLog.css",
        jsFile: "adminAuditLog.js",
        formData: req.body,
        user: req.session.user,
        auditLogs: [],
      });
    }

    // password and confirm password
    if (password !== confirmPassword) {
      return res.status(400).render("adminAuditLog", {
        title: "Audit Log",
        error: "Password and Confirm Password must be the same.",
        cssStylesheet: "adminAuditLog.css",
        jsFile: "adminAuditLog.js",
        formData: req.body,
        user: req.session.user,
        auditLogs: [],
      });
    }

    // Admin can only assign students and tutors,
    // if we need to change to add another admin this is just temporary for now
    if (role !== "student" && role !== "tutor") {
      return res.status(400).render("adminAuditLog", {
        title: "Audit Log",
        error: "Invalid role.",
        cssStylesheet: "adminAuditLog.css",
        jsFile: "adminAuditLog.js",
        formData: req.body,
        user: req.session.user,
        auditLogs: [],
      });
    }

    // FIX LATER, ADD FOR STUDENT?? SOURCEPAGE ERROR
    // Security check to make sure that emails will not be dupliated
    // (if a diff user already has email, return the 400/cannot process req)
    const existingUser = await User.findOne({ email: email });
    const closedWeekdays = await getClosedWeekdays();

    if (existingUser) {
      return res.status(400).render("adminTutorIndex", {
        title: "Admin Manage Tutors",
        cssStylesheet: "tutorIndex.css",
        jsFile: "tutorIndex.js",
        error: "A user with that email already exists.",
        formData: req.body,
        user: req.session.user,
        tutors,
        users,
        courses,
        activeTutors,
        today,
        // changed from "shifts: [],"
        scheduleShifts: [],
        clearShifts: [],
        closedWeekdays,
        selectedTutorId: null,
        selectedShiftDate: "",
        availableShiftBlocks: [],
        openAssignTutorModal: false,
        assignTutorError: null,
      });
    }

    // if there is no tutor course selected when filling out "Add Tutor",
    // then 400/cannot process req is sent and that at least one course must be selected
    if (role == "tutor") {
      if (!tutorCourses) {
        return res.status(400).render("adminTutorIndex", {
          title: "Admin Manage Tutors",
          cssStylesheet: "tutorIndex.css",
          jsFile: "tutorIndex.js",
          error: "Course(s) must be selected to add a tutor.",
          formData: req.body,
          user: req.session.user,
          tutors,
          users,
          courses,
          activeTutors,
          today,
          // changed from "shifts: [],"
          scheduleShifts: [],
          clearShifts: [],
          closedWeekdays,
          selectedTutorId: null,
          selectedShiftDate: "",
          availableShiftBlocks: [],
          openAssignTutorModal: false,
          assignTutorError: null,
        });
      }

      // making sure selected course(s) is turned into an array bc model expects
      // tutorCourses to be an array
      if (!Array.isArray(tutorCourses)) {
        tutorCourses = [tutorCourses];
      }
    } else {
      // students don't have tutor courses
      tutorCourses = [];
    }

    // hashing the passwords
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // when all above is passed/checked, create the new user
    const newUser = await User.create({
      fname: fname,
      lname: lname,
      email: email,
      passwordHash: passwordHash,
      role: role,
      isActive: true,
      tutorCourses: tutorCourses,
    });

    // audit log -> logging new user created, tutor or student
    // if a tutor was created
    if (role === "tutor") {
      //log
      const courseDocs = await Course.find({ _id: { $in: tutorCourses } });
      const courseNames = courseDocs.map((course) => course.courseName);

      await AuditLog.create({
        actionUserId: req.session.user._id,
        actionType: "TUTOR_ADDED",
        targetUserId: newUser._id,
        details: `New tutor ${fname} ${lname} added. Status: active. Courses: ${courseNames.join(", ")}. `,
      });
    }
    // if student was added
    else {
      await AuditLog.create({
        actionUserId: req.session.user._id,
        actionType: "STUDENT_ADDED",
        targetUserId: newUser._id,
        details: `New student ${fname} ${lname} added. Status: active.`,
      });
    }

    // redirect back to the correct page after creating the user
    if (role === "student") {
      return res.redirect("/adminStudentIndex");
    }
    // I only have the "Add User" for students right now, adding tutor very soon
    else {
      return res.redirect(`/${sourcePage}`);
    }
  } catch (err) {
    // in case of any errors, can log them and 500 for unfulfilled req
    return res.status(500).render("adminAuditLog", {
      title: "Audit Log",
      error: "Could not add user.",
      cssStylesheet: "adminAuditLog.css",
      jsFile: "adminAuditLog.js",
      formData: req.body,
      user: req.session.user,
      auditLogs: [],
    });
  }
};

// -------------------------------------------------------------------------

// POST: Handles form submission to change weekday hours
exports.changeHours = async (req, res) => {
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

    // if auth user but not a admin, send to login page
    if (req.session.user.role !== "admin") {
      return res.render("login", {
        title: "Login Page",
        cssStylesheet: "login.css",
        jsFile: "login.js",
        error: "Access denied. Only admins can view this page.",
        user: null,
      });
    }

    const { weekday, centerOpenTime, centerCloseTime, closeWeekdayDropdown } =
      req.body;

    let weekdays = await CenterOpen.find();

    // make sure all required fields were filled out if weekday is set to open
    if (
      (!weekday || !centerOpenTime || !centerCloseTime) &&
      closeWeekdayDropdown === "No"
    ) {
      return res.render("adminAvailabilityIndex", {
        error: "All fields are required.",
        title: "Admin Availability",
        cssStylesheet: "availabilityIndex.css",
        jsFile: "adminAvailability.js",
        user: req.session.user,
        weekdays,
      });
    }

    // helper func to format the time displayed in audit log (log)
    function formatTime(time) {
      if (!time || !time.includes(":")) return "N/A";

      let [h, m] = time.split(":");
      h = Number(h);
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return `${h}:${m} ${ampm}`;
    }

    // fetching prior open & close times for weekday BEFORE being updated
    // (for comparison in audit log)
    const existingDay = await CenterOpen.findOne({ weekday });

    // if closeWeekdayDropdown is set to "Yes", then set the specified weekday to closed
    if (closeWeekdayDropdown === "Yes") {
      await CenterOpen.findOneAndUpdate(
        { weekday: weekday },
        { $set: { isClosed: true } },
      );
      // logging that the day has been fully closed
      await AuditLog.create({
        actionUserId: req.session.user._id,
        actionType: "CENTER_HOURS_CHANGED",
        details: `${weekday} has been set to closed.`,
      });
    } else {
      // otherwise, set hours for specified weekday and set isClosed to false
      const openHour = Number(centerOpenTime.split(":")[0]); // Get open hour as an integer
      const closeHour = Number(centerCloseTime.split(":")[0]); // Get close hour as an integer
      const openMinute = Number(centerOpenTime.split(":")[1]); // Get open minute as an integer
      const closeMinute = Number(centerCloseTime.split(":")[1]); // Get close minute as an integer

      // make sure minutes are set to 00
      if (openMinute !== 0 || closeMinute !== 0) {
        return res.render("adminAvailabilityIndex", {
          error: "Minutes must be 00. Please enter on the hour mark only.",
          title: "Admin Availability",
          cssStylesheet: "availabilityIndex.css",
          jsFile: "adminAvailability.js",
          user: req.session.user,
          weekdays,
        });
      }

      // make sure entered start time is less than entered end time
      if (openHour > closeHour) {
        return res.render("adminAvailabilityIndex", {
          error: "Open Time must be earlier than Close Time.",
          title: "Admin Availability",
          cssStylesheet: "availabilityIndex.css",
          jsFile: "adminAvailability.js",
          user: req.session.user,
          weekdays,
        });
      }

      // make sure center hours cannot be set to the same time
      if (openHour === closeHour) {
        return res.render("adminAvailabilityIndex", {
          error: "Cannot set equal open time and close time.",
          title: "Admin Availability",
          cssStylesheet: "availabilityIndex.css",
          jsFile: "adminAvailability.js",
          user: req.session.user,
          weekdays,
        });
      }

      // for audit log details section -> printing "closed" if weekday was previously closed or
      // the original open/close times
      let priorHours;
      if (existingDay?.isClosed) {
        priorHours = "closed";
      } else {
        // finding ORIGINAL open/close times for weekday we are changing open/close status of
        const priorOpen = formatTime(existingDay?.openTime);
        const priorClose = formatTime(existingDay?.closeTime);
        priorHours = `${priorOpen}-${priorClose}`;
      }

      // for audit log details section -> printing "closed" if weekday set to closed
      // or new open/close times
      let newHours;

      if (closeWeekdayDropdown === "Yes") {
        newHours = "closed";
      } else {
        newHours = `${formatTime(centerOpenTime)} - ${formatTime(centerCloseTime)}`;
      }

      // update MongoDB with new times and set isClosed to false
      await CenterOpen.findOneAndUpdate(
        { weekday: weekday },
        {
          $set: {
            isClosed: false,
            openTime: centerOpenTime,
            closeTime: centerCloseTime,
          },
        },
      );

      // audit log --> logging new open/close time compared to original
      await AuditLog.create({
        actionUserId: req.session.user._id,
        actionType: "CENTER_HOURS_CHANGED",
        details: `${weekday} hours changed from ${priorHours} to ${newHours}.`,
      });
    } // end of else (weekday time updated )

    // get newly updated weekdays
    weekdays = await CenterOpen.find();

    // re-render page once update completes
    res.render("adminAvailabilityIndex", {
      error: null,
      title: "Admin Availability",
      cssStylesheet: "availabilityIndex.css",
      jsFile: "adminAvailability.js",
      user: req.session.user,
      weekdays,
    });
  } catch (err) {
    res.render("adminAvailabilityIndex", {
      error: "Failed to change hours.",
      title: "Admin Availability",
      cssStylesheet: "availabilityIndex.css",
      jsFile: "adminAvailability.js",
      user: req.session.user,
      weekdays: [],
    });
  }
};


// ----------------------------------------------------------------

// // POST - handle form submission to mark notifications as read 

// exports.markNotificationsRead = async (req, res) => {
// try{
// // if not an auth user, send to login page
//     if (!req.session.user) {
//       return res.render("login", {
//         title: "Login Page",
//         cssStylesheet: "login.css",
//         jsFile: "login.js",
//         error: "User not logged in.",
//         user: null,
//       });
//     }

//     // if auth user but not a admin, send to login page
//     if (req.session.user.role !== "admin") {
//       return res.render("login", {
//         title: "Login Page",
//         cssStylesheet: "login.css",
//         jsFile: "login.js",
//         error: "Access denied. Only admins can view this page.",
//         user: null,
//       });
//     }
  
//     let { selectedNotifications } = req.body;

//     // no selected Notifications/re-render page
//     if(!selectedNotifications){
//       return res.redirect("/adminIndex");
//     }

//     // ensure selectedNotifications is an array for logic handling 
//      if (!Array.isArray(selectedNotifications)) {
//       selectedNotifications = [selectedNotifications];
//     }

//     await NotificationLog.updateMany({
//       _id: { $in: selectedNotifications },
//       notificationType: "ADMIN_NOTIF"
//     },
//   {
//     $set: {
//       isRead: true, 
//       readAt: new Date(),
//     },
//   }); 
//   // end of Notificationlog.updateMany 

//  return res.redirect("/adminIndex");

// } catch (err){
//   return res.render("adminIndex", {
//       error: "Could not mark notifications as read.",
//       title: "Admin Page",
//       cssStylesheet: "adminIndex.css",
//       jsFile: "adminIndex.js",
//       user: req.session.user,
//       appointments: [],
//       courses: [],
//       eligibleTutorShifts: [],
//       studentFName: "",
//       studentLName: "",
//       date: "",
//       time: "",
//       course: "",
//       notificationLogs: [],
//     });
// }
// }


// -------------------------------------------------------------------------

// Adding a blackout date functionality (choosing specified time range (covering entire day of dates chosen) 
// that center is fully closed; example: Center normally open M-F, but need to close just on one specified Tuesday
// for holiday
exports.addBlackoutDate = async (req, res) => {
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

    // if auth user but not a admin, send to login page
    if (req.session.user.role !== "admin") {
      return res.render("login", {
        title: "Login Page",
        cssStylesheet: "login.css",
        jsFile: "login.js",
        error: "Access denied. Only admins can view this page.",
        user: null,
      });
    }


    const { startDate, endDate, reason } = req.body;
    const weekdays = await CenterOpen
    .find({}, "weekday isClosed openTime closeTime")
    .sort({ weekday: 1 })


    // ensure all form fields are entered
    if (!startDate || !endDate || !reason) {
      return res.render("adminAvailabilityIndex", {
        title: "Manage Availability",
        cssStylesheet: "adminAvailability.css",
        jsFile: "adminAvailabilityIndex.js",
        error: "All blackout date fields are required.",
        user: req.session.user,
        weekdays,
      });
    }

    // preventing any timezone shifting --> retrieving exact day start time and end time to parse
    const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
    const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
    // setting start date to beginning of day
    const parseStart = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
    // setting end date to end of day (23:59:59.999)
    const parseEnd = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

     // make end date include the whole day
    parseEnd.setHours(23, 59, 59, 999);


    if(parseEnd < parseStart)
      return res.render("adminAvailabilityIndex", {
        title: "Manage Availability",
        cssStylesheet: "adminAvailability.css",
        jsFile: "adminAvailabilityIndex.js",
        error: "End date must be on or after start date.",
        user: req.session.user,
        weekdays
      });



      await centerClosedSchedule.create({
        createdByAdminId: req.session.user._id,
        startDate: parseStart,
        endDate: parseEnd, 
        reason: reason.trim()
      });
      return res.redirect("/adminAvailabilityIndex");


  }
  catch(err){
    console.error("Error adding blackout date:", err);

  return res.render("adminAvailabilityIndex", {
    title: "Manage Availability",
    cssStylesheet: "adminAvailability.css",
    jsFile: "adminAvailabilityIndex.js",
    error: "Something went wrong while adding blackout date.",
    user: req.session.user,
    weekdays: [] // fallback so page doesn’t crash
  });
  }
};




// ------------------------------------------------------------------------------

// Handles admin creation of an exception window for a specific date.
// Allows admin to mark a selected time range as closed (within normal center hours) 
exports.addException = async (req, res) => {
  try{
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

    // if auth user but not a admin, send to login page
    if (req.session.user.role !== "admin") {
      return res.render("login", {
        title: "Login Page",
        cssStylesheet: "login.css",
        jsFile: "login.js",
        error: "Access denied. Only admins can view this page.",
        user: null,
      });
    }



    // retrieve the date, times, & reason entered in form
    const { exceptionDate, startTime, endTime, reason } = req.body; 

    // finding regular center hours for when center is open/closed
    const weekdays = await CenterOpen
    .find({}, "weekday isClosed openTime closeTime")

    // ensure all fields in form were filled & entered correctly 
    if(!exceptionDate || !startTime || !endTime || !reason ){
       return res.render("adminAvailabilityIndex", {
        title: "Admin Availability",
        cssStylesheet: "availabilityIndex.css",
        jsFile: "adminAvailability.js",
        error: "All exception fields are required.",
        user: req.session.user,
        weekdays,
      });
    }

     // parse block date 
     // same functionality as blackout date
    const [year, month, day] = exceptionDate.split("-").map(Number);
    const parsedExceptionDate = new Date(year, month - 1, day, 0, 0, 0, 0);

    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    // parse times for validation checks 
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    // enusre that both the start minute and end minutes are :00 / on the hour
    if (startMinute !== 0 || endMinute !== 0) {
      return res.render("adminAvailabilityIndex", {
        title: "Admin Availability",
        cssStylesheet: "availabilityIndex.css",
        jsFile: "adminAvailability.js",
        error: "Exception range must be entered on the hour.",
        user: req.session.user,
        weekdays,
      });
    }

    // ensure the start time is before the end time/can't be same times 
    if (startHour >= endHour) {
      return res.render("adminAvailabilityIndex", {
        title: "Admin Availability",
        cssStylesheet: "availabilityIndex.css",
        jsFile: "adminAvailability.js",
        error: "Start time must be earlier than end time.",
        user: req.session.user,
        weekdays,
      });
    }

    // find the weekday for selected date of time block 
    const weekdayNames = [
      "Sunday", 
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ];

    const weekday = weekdayNames[parsedExceptionDate.getDay()];

    // retrieve the normal center hours for specified date
    const centerOpenDay = await CenterOpen.findOne({ weekday });

    // check if the day chosen for time block is closed
    if (!centerOpenDay || centerOpenDay.isClosed) {
      return res.render("adminAvailabilityIndex", {
        title: "Admin Availability",
        cssStylesheet: "availabilityIndex.css",
        jsFile: "adminAvailability.js",
        error: `Center is fully closed on ${weekday}.`,
        user: req.session.user,
        weekdays,
      });
    }

    // check if the selected date for time block is within a specified blackout date
    // 
    const blackoutDate = await centerClosedSchedule.findOne({
      startDate: { $lte: endOfDay },
      endDate: { $gte: startOfDay }
    });

    if(blackoutDate){
      return res.render("adminAvailabilityIndex", {
        title: "Admin Availability",
        cssStylesheet: "availabilityIndex.css",
        jsFile: "adminAvailability.js",
        error: `Cannot add exception due to blackout date.`,
        user: req.session.user,
        weekdays,
      });
    }

    // ensure the time block chosen is within the center open hours for specified date
    const openHr = Number(centerOpenDay.openTime.split(":")[0]);
    const closeHr = Number(centerOpenDay.closeTime.split(":")[0]);
    const openMin = Number(centerOpenDay.openTime.split(":")[1]);

    // similar func to assign tutor hours 
    let validStartHr;
    if (openMin === 0 ){
      validStartHr = openHr;
    } else {
      validStartHr = openHr + 1; 
    }

    let validEndHr = closeHr; 

    // ensuring the time block specified is within the center open schedule hours 
    if (startHour < validStartHr || endHour > validEndHr) {
      return res.render("adminAvailabilityIndex", {
        title: "Admin Availability",
        cssStylesheet: "availabilityIndex.css",
        jsFile: "adminAvailability.js",
        error: "Exception must be within the center's open hours.",
        user: req.session.user,
        weekdays,
      });
    }


    // prevent duplicate time blocks (check for an exisiting time block)
    const existingException = await CenterException.findOne({
      exceptionDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      startTime,
      endTime,
    });


    // if an exisiting time block for specified date already exists, then 
    // ensure does not get blocked again/send error message
    if (existingException) {
      return res.render("adminAvailabilityIndex", {
        title: "Admin Availability",
        cssStylesheet: "availabilityIndex.css",
        jsFile: "adminAvailability.js",
        error: "That time exception already exists for this date.",
        user: req.session.user,
        weekdays,
      });
    }

    // once passing all validation checks, create the time block 
    // create the time block
    await CenterException.create({
      createdByAdminId: req.session.user._id,
      exceptionDate: parsedExceptionDate,
      startTime,
      endTime,
      reason: reason.trim(),
    });

      
  // helper function (will update later to remove repeat of this func/only call from here )
  function formatTo12Hour(timeStr) {
    const [hourStr, minute] = timeStr.split(":");
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";

    hour = hour % 12;
    if (hour === 0) hour = 12;

    return `${hour}:${minute} ${ampm}`;
  }


  // audit log creation describing the time block made & redirecting to the admin availability index page
    await AuditLog.create({
      actionUserId: req.session.user._id,
      actionType: "CENTER_HOURS_CHANGED",
      details: `Exception added on ${exceptionDate}: ${formatTo12Hour(startTime)} - ${formatTo12Hour(endTime)}. Reason: ${reason.trim()}.`,
    });

    return res.redirect("/adminAvailabilityIndex");

  }
  catch(err){
    return res.render("adminAvailabilityIndex", {
      title: "Admin Availability",
      cssStylesheet: "availabilityIndex.css",
      jsFile: "adminAvailability.js",
      error: "Something went wrong while adding exception.",
      user: req.session.user,
      weekdays: [],
    });
  }
}; 
