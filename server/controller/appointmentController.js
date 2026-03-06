const Appointment = require("../model/appointmentModel");
const TutorShift = require("../model/tutorShiftModel");

// GET: load the booking page with available shifts
async function getBookingPage(req, res) {
    try {
        // find all shifts that haven't been booked yet
        const availableShifts = await TutorShift.find({ isBooked: false })
            .populate("tutorId", "fname lname") // pull tutor's name from User model
            .sort({ shiftDate: 1, startTime: 1 });

        res.render("studentAppointment", {
            title: "Book an Appointment",
            cssStylesheet: "studentAppointment.css",
            jsFile: "studentScript.js",
            error: null,
            user: req.session.user || { role: "student" },  // you can swith to admin/tutor/student as needed
            availableShifts
        });
    } catch (err) {
        console.error(err);
        res.render("studentAppointment", {
            title: "Book an Appointment",
            cssStylesheet: "studentAppointment.css",
            jsFile: "studentScript.js",
            error: "Failed to load available appointments.",
            user: req.session.user || { role: "student" },
            availableShifts: []
        });
    }
}

// POST: handle appointment form submission
async function createAppointment(req, res) {
    try {
        const { tutorShiftId, course } = req.body;

        // get the selected shift
        const shift = await TutorShift.findById(tutorShiftId);
        if (!shift || shift.isBooked) {
            return res.render("studentAppointment", {
                title: "Book an Appointment",
                cssStylesheet: "studentAppointment.css",
                jsFile: "studentScript.js",
                error: "That shift is no longer available.",
                user: req.session.user || { role: "student" },
                availableShifts: []
            });
        }

        // create the appointment
        const appointment = new Appointment({
            studentId: req.session.user._id, // will work once real auth is set up
            tutorShiftId: shift._id,
            course,
            appointmentDate: shift.shiftDate,
            startTime: shift.startTime,
            endTime: shift.endTime
        });

        await appointment.save();

        // mark the shift as booked
        shift.isBooked = true;
        await shift.save();

        res.redirect("/studentIndex");
    } catch (err) {
        console.error(err);
        res.render("studentAppointment", {
            title: "Book an Appointment",
            cssStylesheet: "studentAppointment.css",
            jsFile: "studentScript.js",
            error: "Failed to book appointment.",
            user: req.session.user || { role: "student" },
            availableShifts: []
        });
    }
}

module.exports = { getBookingPage, createAppointment };