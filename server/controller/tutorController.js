const TutorShift = require('../model/tutorShiftModel');
const Appointment = require("../model/appointmentModel");
const mongoose = require('mongoose');

// GET: renders tutor index
exports.getTutorIndex = async (req, res) => {
    try {
        // if not an auth user, send to login page
        if (!req.session.user) {
            return res.render('login', {
                title: 'Login Page',
                cssStylesheet: 'login.css',
                jsFile: null,
                error: "User not logged in.",
                user: null
            });
        }

        // if auth user but not a tutor, send to login page
        if (req.session.user.role !== "tutor") {
            return res.render('login', {
                title: 'Login Page',
                cssStylesheet: 'login.css',
                jsFile: null,
                error: "Access denied. Only tutors can view this page.",
                user: req.session.user
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


        // render tutor page
        res.render('tutorIndex', {
            error: null,
            shiftError,
            title: 'Tutor Appointments',
            cssStylesheet: 'tutorStyle.css',
            jsFile: 'tutorScript.js',
            user: req.session.user,
            bookedAppointments: [],
            appointmentsLoaded: false,
            upcomingTutorShifts,
            pastBookedAppointments: [],
            pastAppointmentsLoaded: false
        });

    } catch (err) {
        res.render('tutorIndex', {
            error: "Failed to load tutor index page.",
            shiftError: null,
            title: 'Tutor Appointments',
            cssStylesheet: 'tutorStyle.css',
            jsFile: 'tutorScript.js',
            user: req.session.user,
            bookedAppointments: [],
            appointmentsLoaded: false,
            upcomingTutorShifts: [],
            pastBookedAppointments: [],
            pastAppointmentsLoaded: false
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

        // get current session user id and convert to ObjectId format for finding booked appointments and shifts
        const tutorId = new mongoose.Types.ObjectId(req.session.user._id);

        // function to get all shifts for the tutor and sort by date and time
        let upcomingTutorShifts = [];
        let shiftError = null;
        try {
            upcomingTutorShifts = await getUpcomingTutorShifts(tutorId);
        } catch (err) {
            shiftError = "Failed to load tutor shifts.";
        }

        // get any booked appointments under current tutor user
        const bookedAppointments = await Appointment.aggregate([
            { $lookup: { from: "tutorshifts", localField: "tutorShiftId", foreignField: "_id", as: "tutorShift" } },
            { $unwind: "$tutorShift" },
            { $match: { "tutorShift.tutorId": tutorId, "tutorShift.isBooked": true, appointmentDate: { $gte: new Date(new Date().setUTCHours(0, 0, 0, 0)) } } }, // shows appointments for today and future (not based on time)
            { $project: { course: 1, appointmentDate: 1, startTime: 1, endTime: 1, appointmentStatus: 1 } },
            { $sort: { appointmentDate: 1, startTime: 1 } }
        ]);

        // get any past booked appointments under current tutor user
        let pastBookedAppointments = await Appointment.aggregate([
            { $lookup: { from: "tutorshifts", localField: "tutorShiftId", foreignField: "_id", as: "tutorShift" } },
            { $unwind: "$tutorShift" },
            { $match: { "tutorShift.tutorId": tutorId, "tutorShift.isBooked": true, appointmentDate: { $lt: new Date(new Date().setUTCHours(0, 0, 0, 0)) } } }, // shows appointments for today and past (not based on time)
            { $project: { course: 1, appointmentDate: 1, startTime: 1, endTime: 1, appointmentStatus: 1 } },
            { $sort: { appointmentDate: 1, startTime: 1 } }
        ]);

        // update appointment status to completed if past the current date and time (past appointments only checks date)
        for (let i = 0; i < pastBookedAppointments.length; i++) {
            const currAppointment = pastBookedAppointments[i];
            const currAppointmentDate = new Date(currAppointment.appointmentDate);
            // set the hours for the date of the current appointment to the end time using the stored hours
            currAppointmentDate.setHours(
                parseInt(currAppointment.endTime.split(":")[0]),
                parseInt(currAppointment.endTime.split(":")[1])
            );

            // update status to completed if current appointment is set to scheduled and past the current time
            if (currAppointment.appointmentStatus === "scheduled" && currAppointmentDate < new Date()) {
                await Appointment.findByIdAndUpdate(currAppointment._id, { appointmentStatus: "completed" });
                bookedAppointments[i].appointmentStatus = "completed";
            }
        }

        // render tutorIndex page with bookedAppointments and pastBookedAppointments under tutor
        res.render("tutorIndex", {
            title: "Tutor Appointments",
            cssStylesheet: "tutorStyle.css",
            jsFile: "tutorScript.js",
            error: null,
            shiftError,
            user: req.session.user,
            bookedAppointments,
            appointmentsLoaded: true,
            upcomingTutorShifts,
            pastBookedAppointments,
            pastAppointmentsLoaded: true
        });
    } catch (err) {
        res.render("tutorIndex", {
            title: "Tutor Appointments",
            cssStylesheet: "tutorStyle.css",
            jsFile: "tutorScript.js",
            error: "Failed to show appointments.",
            shiftError: null,
            user: req.session.user,
            bookedAppointments: [],
            appointmentsLoaded: true,
            upcomingTutorShifts: [],
            pastBookedAppointments: [],
            pastAppointmentsLoaded: true
        });
    }
}

// try to get the tutor's upcoming shifts, if error occurs render page with error message and empty shifts array
async function getUpcomingTutorShifts(theTutorId) {
  try {
    const shifts = await TutorShift.find({
      tutorId: theTutorId,
      shiftDate: { $gte: new Date(new Date().setUTCHours(0, 0, 0, 0)) }
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
        timeRanges: []
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
        shiftEnd: shift.endTime
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
        const comments = req.body['comments-textarea'];

        // no appointment selected
        if (!appointmentId) {
            return res.render('tutorIndex', {
                error: "No appointment selected.",
                shiftError,
                title: 'Tutor Appointments',
                cssStylesheet: 'tutorStyle.css',
                jsFile: 'tutorScript.js',
                user: req.session.user,
                bookedAppointments: [],
                appointmentsLoaded: false,
                upcomingTutorShifts,
                pastBookedAppointments: [],
                pastAppointmentsLoaded: false
            });
        }

        // update the comments for specific appointment
        const appointmentExist = await Appointment.findOneAndUpdate({ _id: appointmentId }, { $set: { tutorComments: comments } });

        // no appointment found
        if (!appointmentExist) {
            return res.render('tutorIndex', {
                error: "Appointment not found.",
                shiftError,
                title: 'Tutor Appointments',
                cssStylesheet: 'tutorStyle.css',
                jsFile: 'tutorScript.js',
                user: req.session.user,
                bookedAppointments: [],
                appointmentsLoaded: false,
                upcomingTutorShifts,
                pastBookedAppointments: [],
                pastAppointmentsLoaded: false
            });
        }

        // re-render tutor page
        res.render('tutorIndex', {
            error: null,
            shiftError,
            title: 'Tutor Appointments',
            cssStylesheet: 'tutorStyle.css',
            jsFile: 'tutorScript.js',
            user: req.session.user,
            bookedAppointments: [],
            appointmentsLoaded: false,
            upcomingTutorShifts,
            pastBookedAppointments: [],
            pastAppointmentsLoaded: false
        });
    } catch (err) {
        res.render('tutorIndex', {
            error: "Failed to load tutor index page.",
            shiftError: null,
            title: 'Tutor Appointments',
            cssStylesheet: 'tutorStyle.css',
            jsFile: 'tutorScript.js',
            user: req.session.user,
            bookedAppointments: [],
            appointmentsLoaded: false,
            upcomingTutorShifts: [],
            pastBookedAppointments: [],
            pastAppointmentsLoaded: false
        });
    }   
}


// GET: display specific tutor comments in comments text area if any for appointment selected
// exports.viewComment = async (req, res) => {

// }
