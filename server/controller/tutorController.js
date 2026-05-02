const TutorShift = require("../model/tutorShiftModel");
const Appointment = require("../model/appointmentModel");
const centerOpen = require("../model/centerOpenSchedule");
const { formatTo12Hour } = require("../services/timeService");
const mongoose = require("mongoose");

// GET: renders tutor index page and display the tutor's booked appointments
exports.getTutorIndex = async (req, res) => {
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

    // if auth user but not a tutor, send to login page
    if (req.session.user.role !== "tutor") {
      return res.render("login", {
        title: "Login Page",
        cssStylesheet: "login.css",
        jsFile: "login.js",
        error: "Access denied. Only tutors can view this page.",
        user: req.session.user,
      });
    }

    const tutorId = new mongoose.Types.ObjectId(req.session.user._id);
    // function to get all shifts for the tutor and sort by date and time
    let upcomingTutorShifts = [];
    let shiftError = null;
    try {
      upcomingTutorShifts = await getUpcomingTutorShifts(tutorId);
    } catch (err) {
      shiftError = "Failed to load upcoming tutor shifts.";
    }


    // get any booked appointments under current tutor user
    const bookedAppointments = await Appointment.aggregate([
      {
        $lookup: {
          from: "tutorshifts",
          localField: "tutorShiftId",
          foreignField: "_id",
          as: "tutorShift",
        },
      },
      { $unwind: "$tutorShift" },
      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      {
        $match: {
          "tutorShift.tutorId": tutorId,
          "tutorShift.isBooked": true,
          appointmentStatus: { $ne: "cancelled" },
          appointmentDate: {
            $gte: new Date(new Date().setUTCHours(0, 0, 0, 0)),
          },
        },
      }, // shows appointments for today and future (not based on time)
      {
        $project: {
          course: 1,
          appointmentDate: 1,
          startTime: 1,
          endTime: 1,
          tutorComments: 1,
          attendance: 1,
          "student.fname": 1,
          "student.lname": 1,
        },
      },
      { $sort: { appointmentDate: 1, startTime: 1 } },
    ]);

    // get any past booked appointments under current tutor user
    let pastBookedAppointments = await Appointment.aggregate([
      {
        $lookup: {
          from: "tutorshifts",
          localField: "tutorShiftId",
          foreignField: "_id",
          as: "tutorShift",
        },
      },
      { $unwind: "$tutorShift" },
      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      {
        $match: {
          "tutorShift.tutorId": tutorId,
          "tutorShift.isBooked": true,
          appointmentStatus: { $ne: "cancelled" },
          appointmentDate: {
            $lt: new Date(new Date().setUTCHours(0, 0, 0, 0)),
          },
        },
      }, // shows appointments for today and past (not based on time)
      {
        $project: {
          course: 1,
          appointmentDate: 1,
          startTime: 1,
          endTime: 1,
          tutorComments: 1,
          attendance: 1,
          "student.fname": 1,
          "student.lname": 1,
        },
      },
      { $sort: { appointmentDate: 1, startTime: 1 } },
    ]);

    // update appointment status to completed if past the current date and time (past appointments only checks date)
    for (let i = 0; i < pastBookedAppointments.length; i++) {
      const currAppointment = pastBookedAppointments[i];
      const currAppointmentDate = new Date(currAppointment.appointmentDate);
      // set the hours for the date of the current appointment to the end time using the stored hours
      currAppointmentDate.setHours(
        parseInt(currAppointment.endTime.split(":")[0]),
        parseInt(currAppointment.endTime.split(":")[1]),
      );

      // update status to completed if current appointment is set to scheduled and past the current time
      if (
        currAppointment.appointmentStatus === "scheduled" &&
        currAppointmentDate < new Date()
      ) {
        await Appointment.findByIdAndUpdate(currAppointment._id, {
          appointmentStatus: "completed",
        });
        pastBookedAppointments[i].appointmentStatus = "completed";
      }
    }

    // set session error to null
    const error = req.session.error;
    req.session.error = null;

    // render tutorIndex page with bookedAppointments and pastBookedAppointments under tutor
    res.render("tutorIndex", {
      title: "Tutor Appointments",
      cssStylesheet: "tutorStyle.css",
      jsFile: "tutorScript.js",
      error,
      shiftError,
      user: req.session.user,
      bookedAppointments,
      appointmentsLoaded: true,
      upcomingTutorShifts,
      pastBookedAppointments,
      pastAppointmentsLoaded: true,
      formatTo12Hour
    });
  } catch (err) {
    res.render("tutorIndex", {
      error: "Failed to load appointments.",
      shiftError: null,
      title: "Tutor Appointments",
      cssStylesheet: "tutorStyle.css",
      jsFile: "tutorScript.js",
      user: req.session.user,
      bookedAppointments: [],
      appointmentsLoaded: false,
      upcomingTutorShifts: [],
      pastBookedAppointments: [],
      pastAppointmentsLoaded: false,
      formatTo12Hour
    });
  }
};


// try to get the tutor's upcoming shifts, if error occurs render page with error message and empty shifts array
async function getUpcomingTutorShifts(theTutorId) {
  try {
    const shifts = await TutorShift.find({
      tutorId: theTutorId,
      shiftDate: { $gte: new Date(new Date().setUTCHours(0, 0, 0, 0)) },
    })
      .sort({ shiftDate: 1, startTime: 1 })
      .lean(); // transform mongoose documents to plain JS objects for easier manipulation

    // if there are no shifts found for the tutor, return an empty array
    if (!shifts || shifts.length === 0) {
      return [];
    }

    return groupNonconsecutiveShifts(shifts);
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

// POST: update submitted comment in MongoDB for specific tutor appointment selected
exports.submitComment = async (req, res) => {
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

    // if auth user but not a tutor, send to login page
    if (req.session.user.role !== "tutor") {
      return res.render("login", {
        title: "Login Page",
        cssStylesheet: "login.css",
        jsFile: "login.js",
        error: "Access denied. Only tutors can view this page.",
        user: null,
      });
    }

    const tutorId = new mongoose.Types.ObjectId(req.session.user._id);
    // function to get all shifts for the tutor and sort by date and time
    let upcomingTutorShifts = [];
    let shiftError = null;
    try {
      upcomingTutorShifts = await getUpcomingTutorShifts(tutorId);
    } catch (err) {
      shiftError = "Failed to load upcoming tutor shifts.";
    }

    // get appointment id and comments
    const appointmentId = req.body.selectedAppointment;
    const comments = req.body["comments-textarea"];

    // if comments not entered/empty/empty spaces
    if (!comments || comments.trim() === "") {
      req.session.error = "Comment required.";
      return res.redirect("/tutorIndex");
    }

    // no appointment selected
    if (!appointmentId) {
      req.session.error = "No appointment selected.";
      return res.redirect("/tutorIndex");
    }


    // no appointment found
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      req.session.error = "Appointment not found.";
      return res.redirect("/tutorIndex");
    }


    // cannot submit comments the day(s) after the appointment date (times excluded)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const apptDate = new Date(appointment.appointmentDate);
    apptDate.setHours(0, 0, 0, 0);

    if (today > apptDate) {
      req.session.error = "Tutor cannot submit comments the day(s) after appointment date.";
      return res.redirect("/tutorIndex");
    }


    // update the comments for specific appointment
    appointment.tutorComments = comments;
    await appointment.save();

    // redirect to tutorIndex page
    return res.redirect("/tutorIndex");

  } catch (err) {
    res.render("tutorIndex", {
      error: "Failed to load tutor index page.",
      shiftError: null,
      title: "Tutor Appointments",
      cssStylesheet: "tutorStyle.css",
      jsFile: "tutorScript.js",
      user: req.session.user,
      bookedAppointments: [],
      appointmentsLoaded: false,
      upcomingTutorShifts: [],
      pastBookedAppointments: [],
      pastAppointmentsLoaded: false,
      formatTo12Hour
    });
  }
};

// POST: update submitted start and end times in MongoDB for specific tutor appointment selected
exports.submitTimes = async (req, res) => {
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

    // if auth user but not a tutor, send to login page
    if (req.session.user.role !== "tutor") {
      return res.render("login", {
        title: "Login Page",
        cssStylesheet: "login.css",
        jsFile: "login.js",
        error: "Access denied. Only tutors can view this page.",
        user: null,
      });
    }

    const tutorId = new mongoose.Types.ObjectId(req.session.user._id);
    // function to get all shifts for the tutor and sort by date and time
    let upcomingTutorShifts = [];
    let shiftError = null;
    try {
      upcomingTutorShifts = await getUpcomingTutorShifts(tutorId);
    } catch (err) {
      shiftError = "Failed to load upcoming tutor shifts.";
    }

    // get appointment id and start and end times
    // Note: actual start and end times do not need to end in :00
    const appointmentId = req.body.selectedAppointment;
    const sessionStartTime = req.body["session-start-time"];
    const sessionEndTime = req.body["session-end-time"];

    // if start and end times not entered
    if (!sessionStartTime || !sessionEndTime) {
      req.session.error = "Start time and end time are required.";
      return res.redirect("/tutorIndex");
    }

    // no appointment selected
    if (!appointmentId) {
      req.session.error = "No appointment selected.";
      return res.redirect("/tutorIndex");
    }

    // split entered times
    const startHour = Number(sessionStartTime.split(":")[0]); // Get start hour as an integer
    const endHour = Number(sessionEndTime.split(":")[0]); // Get end hour as an integer
    const startMinute = Number(sessionStartTime.split(":")[1]); // Get start minute as an integer
    const endMinute = Number(sessionEndTime.split(":")[1]); // Get end minute as an integer

    // get appointment in order to get date
    const appointment = await Appointment.findOne({
      _id: appointmentId,
    }).populate("appointmentDate");

    // no appointment found
    if (!appointment) {
      req.session.error = "Appointment not found.";
      return res.redirect("/tutorIndex");
    }


    // cannot submit the actual start and end times the day(s) before or the day after the appointment date (times excluded)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const apptDate = new Date(appointment.appointmentDate);
    apptDate.setHours(0, 0, 0, 0);

    if (today < apptDate || today > apptDate) {
      req.session.error = "Tutor cannot submit actual start and times the day(s) before or after appointment date.";
      return res.redirect("/tutorIndex");
    }


    // compare entered times with general center hours
    const weekdays = await centerOpen.find(); // get the days of the week
    const weekdayIndex = appointment.appointmentDate.getDay(); // get weekday index (0 = Sunday, 6 = Saturday)
    const weekdayIndices = [6, 0, 1, 2, 3, 4, 5]; // since getDay indexes 0 = Sunday, 6 = Saturday, move the indices around to match the weekdays in application
    const weekday = weekdays[weekdayIndices[weekdayIndex]]; // get the weekday object
    const centerStartHour = Number(weekday.openTime.split(":")[0]); // Get start hour as an integer
    const centerEndHour = Number(weekday.closeTime.split(":")[0]); // Get end hour as an integer
    const centerEndMinute = Number(weekday.closeTime.split(":")[1]); // Get end minute as an integer

    // start time cannot precede general center open time and end time cannot exceed the general center close time
    if (
      startHour < centerStartHour ||
      endHour > centerEndHour ||
      (endHour === centerEndHour && endMinute > centerEndMinute)
    ) {
      req.session.error = "Start time and end time cannot occur outside general center hours.";
      return res.redirect("/tutorIndex");
    }

    // start time cannot be greater than end time
    if (
      startHour > endHour ||
      (endHour - startHour === 0 && endMinute < startMinute)
    ) {
      req.session.error = "Start time must precede end time.";
      return res.redirect("/tutorIndex");
    }

    // session can only be 5 minutes short
    if (
      (endHour - startHour === 1 && 60 - startMinute + endMinute < 5) ||
      (startHour === endHour && endMinute - startMinute < 5)
    ) {
      req.session.error = "Appointment must be at least 5 minutes long.";
      return res.redirect("/tutorIndex");
    }

    // session can only be an hour max long
    if (
      endHour - startHour > 1 ||
      (endHour - startHour === 1 && endMinute > startMinute)
    ) {
      req.session.error = "Appointment can only be an hour long maximum.";
      return res.redirect("/tutorIndex");
    }

    // update the times for specific appointment
    const appointmentUpdated = await Appointment.findOneAndUpdate(
      { _id: appointmentId },
      {
        $set: {
          "attendance.actualStart": sessionStartTime,
          "attendance.actualEnd": sessionEndTime,
        },
      },
    );

    // appointment unable to update
    if (!appointmentUpdated) {
      req.session.error = "Appointment could not be updated.";
      return res.redirect("/tutorIndex");
    }


    // redirect to tutorIndex page
    return res.redirect("/tutorIndex");

  } catch (err) {
    res.render("tutorIndex", {
      error: "Failed to load tutor index page.",
      shiftError: null,
      title: "Tutor Appointments",
      cssStylesheet: "tutorStyle.css",
      jsFile: "tutorScript.js",
      user: req.session.user,
      bookedAppointments: [],
      appointmentsLoaded: false,
      upcomingTutorShifts: [],
      pastBookedAppointments: [],
      pastAppointmentsLoaded: false,
      formatTo12Hour
    });
  }
};

// POST: update submitted show/now show in MongoDB for specific tutor appointment selected
exports.submitShow = async (req, res) => {
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

    // if auth user but not a tutor, send to login page
    if (req.session.user.role !== "tutor") {
      return res.render("login", {
        title: "Login Page",
        cssStylesheet: "login.css",
        jsFile: "login.js",
        error: "Access denied. Only tutors can view this page.",
        user: null,
      });
    }

    const tutorId = new mongoose.Types.ObjectId(req.session.user._id);
    // function to get all shifts for the tutor and sort by date and time
    let upcomingTutorShifts = [];
    let shiftError = null;
    try {
      upcomingTutorShifts = await getUpcomingTutorShifts(tutorId);
    } catch (err) {
      shiftError = "Failed to load upcoming tutor shifts.";
    }

    // get appointment id and show value
    const appointmentId = req.body.selectedAppointment;
    const isShow = req.body["select-show"];

    // if isShow not entered
    if (!isShow) {
      req.session.error = "Required to enter show/no show.";
      return res.redirect("/tutorIndex");
    }

    // no appointment selected
    if (!appointmentId) {
      req.session.error = "No appointment selected.";
      return res.redirect("/tutorIndex");
    }


    // error if no appointment is found under appointmentId
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      req.session.error = "Appointment not found.";
      return res.redirect("/tutorIndex");
    }

    // if trying to update show/no-show value before the start date of the appointment occurs, then send an error
    // get the appointment date and set the hours properly
    const apptStartDate = new Date(appointment.appointmentDate); 
    const startHour = parseInt(appointment.startTime.split(":")[0]);
    apptStartDate.setHours(startHour, 0, 0, 0);

    let today = new Date(); // gets current date and time

    // if the current moment is earlier than the appointment date and time, send an error
    if (today < apptStartDate) {
      req.session.error = "Tutor cannot update attendance before the appointment start time.";
      return res.redirect("/tutorIndex");
    }


    // if trying to update show/no-show value the day after the day of the appointment date, then send an error
    // set hours to the same, only care about comparing the date
    today.setHours(0, 0, 0, 0);
    const apptDate = new Date(appointment.appointmentDate);
    apptDate.setHours(0, 0, 0, 0);

    // if the current moment is the day(s) after the appointment date, send an error
    if (today > apptDate) {
      req.session.error = "Tutor cannot update attendance after the appointment date has passed.";
      return res.redirect("/tutorIndex");
    }

    // change to the proper value needed in MongoDB
    let updateValue;
    if (isShow === "no-show") {
      const apptEndDate = new Date(appointment.appointmentDate); 
      const endHour = parseInt(appointment.endTime.split(":")[0]);
      apptEndDate.setHours(endHour, 0, 0, 0);
      today = new Date(); // reset to current date and time
      // if trying to submit no-show before the appointment end time, send an error
      if (today < apptEndDate) {
        req.session.error = "Tutor cannot update attendance to no-show before the appointment end time has passed.";
        return res.redirect("/tutorIndex");
      }
      updateValue = "noShow";
    } else if (isShow === "show") {
      updateValue = "attended";
    } else {
      req.session.error = "Invalid show/no-show value.";
      return res.redirect("/tutorIndex");
    }

    // update the show/no show for specific appointment
    appointment.attendance.attendanceStatus = updateValue;
    await appointment.save();

    // redirect to tutorIndex page
    return res.redirect("/tutorIndex");

  } catch (err) {
    res.render("tutorIndex", {
      error: "Failed to load tutor index page.",
      shiftError: null,
      title: "Tutor Appointments",
      cssStylesheet: "tutorStyle.css",
      jsFile: "tutorScript.js",
      user: req.session.user,
      bookedAppointments: [],
      appointmentsLoaded: false,
      upcomingTutorShifts: [],
      pastBookedAppointments: [],
      pastAppointmentsLoaded: false,
      formatTo12Hour
    });
  }
};


// GET: load the page and display the cancelled appointments under specific tutor
exports.getCancelledAppointments = async (req, res) => {
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

    // if auth user but not a tutor, send to login page
    if (req.session.user.role !== "tutor") {
      return res.render("login", {
        title: "Login Page",
        cssStylesheet: "login.css",
        jsFile: "login.js",
        error: "Access denied. Only tutors can view this page.",
        user: req.session.user,
      });
    }

    const tutorId = new mongoose.Types.ObjectId(req.session.user._id);

    // get any cancelled booked appointments under current tutor user (appointmentStatus is "cancelled")
    const cancelledAppointments = await Appointment.aggregate([
      {
        $lookup: {
          from: "tutorshifts",
          localField: "tutorShiftId",
          foreignField: "_id",
          as: "tutorShift",
        },
      },
      { $unwind: "$tutorShift" },
      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      {
        $match: {
          "tutorShift.tutorId": tutorId,
          appointmentStatus: "cancelled",
        },
      },
      {
        $project: {
          course: 1,
          appointmentDate: 1,
          startTime: 1,
          endTime: 1,
          "student.fname": 1,
          "student.lname": 1,
        },
      },
      { $sort: { appointmentDate: 1, startTime: 1 } },
    ]);

    // render cancelled page
    res.render("tutorCancelled", {
      error: null,
      title: "Cancelled Appointments",
      cssStylesheet: "tutorStyle.css",
      jsFile: "tutorScript.js",
      user: req.session.user,
      appointmentsLoaded: true,
      cancelledAppointments,
      formatTo12Hour
    });
  } catch (err) {
    res.render("tutorCancelled", {
      error: "Failed to load cancelled appointments page.",
      title: "Cancelled Appointments",
      cssStylesheet: "tutorStyle.css",
      jsFile: "tutorScript.js",
      user: req.session.user,
      appointmentsLoaded: false,
      cancelledAppointments: [],
      formatTo12Hour
    });
  }
};


exports.changePassword = async (req, res) => {
  
};
