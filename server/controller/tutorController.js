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
        let tutorShifts = [];
        let shiftError = null;
        try {
            tutorShifts = await getTutorShifts(tutorId);
        } catch (err) {
            console.error("Shift load error:", err);
            shiftError = "Failed to load tutor shifts.";
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
            tutorShifts,
            pastBookedAppointments: [],
            pastAppointmentsLoaded: false
        });

    } catch (err) {
        console.error(err);
        res.render('tutorIndex', {
            error: "Failed to load tutor index page.",
            shiftError: null,
            title: 'Tutor Appointments',
            cssStylesheet: 'tutorStyle.css',
            jsFile: 'tutorScript.js',
            user: req.session.user,
            bookedAppointments: [],
            appointmentsLoaded: false,
            tutorShifts: [],
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
        let tutorShifts = [];
        let shiftError = null;
        try {
            tutorShifts = await getTutorShifts(tutorId);
        } catch (err) {
            console.error("Shift load error:", err);
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
            tutorShifts,
            pastBookedAppointments,
            pastAppointmentsLoaded: true
        });
    } catch (err) {
        console.error("Tutor appointment error:", err);
        res.render("tutorIndex", {
            title: "Tutor Appointments",
            cssStylesheet: "tutorStyle.css",
            jsFile: "tutorScript.js",
            error: "Failed to show appointments.",
            shiftError: null,
            user: req.session.user,
            bookedAppointments: [],
            appointmentsLoaded: true,
            tutorShifts: [],
            pastBookedAppointments: [],
            pastAppointmentsLoaded: true
        });
    }
}


// try to get the tutor's shifts, if error occurs render page with error message and empty shifts array
async function getTutorShifts(theTutorId) {
    try {
        const tutorShifts = await TutorShift.aggregate([
            {
                $match: { // filter shifts to only the tutor's shifts
                    tutorId: theTutorId,
                },
            },
            { $sort: { shiftDate: 1, startTime: 1 } }, // sort by date and time so $first and $last retrieves the correct records
            {
                $group: { // group by date to find the beginning and end of a shift
                    _id: { tutorId: "$tutorId", shiftDate: "$shiftDate" },
                    shiftStart: { $first: "$startTime" },
                    shiftEnd: { $last: "$endTime" },
                },
            },
            {
                $project: { // format result with only necessary details for displaying tutor shifts - date, start/end time
                    _id: 0,
                    tutorId: "$_id.tutorId",
                    shiftDate: "$_id.shiftDate",
                    shiftStart: 1,
                    shiftEnd: 1,
                },
            },
            { $sort: { shiftDate: 1 } },
        ]);

        // if there are no shifts found for the tutor, return an empty array
        if (!tutorShifts || tutorShifts.length === 0) {
            console.log("No shifts found for tutor.");
            return [];
        }

        return tutorShifts;

    } catch (err) {
        console.error(err);
        throw err;
    }
}
