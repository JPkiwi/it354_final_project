const Appointment = require("../model/appointmentModel");
const TutorShift = require("../model/tutorShiftModel");

//not currently working
// POST: handle bookingappointment form submission
exports.createAppointment = async (req, res) => {
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
            cssStylesheet: "studentStyle.css",
            jsFile: "studentScript.js",
            error: "Failed to book appointment.",
            user: req.session.user || { role: "student" },
            availableShifts: []
        });
    }
};

// this is not currently working fully. It is more of a placeholder
// eventually this will be used to display the student's booked appointments
// GET: display the student's booked appointments
exports.getBookedAppointments = async (req, res) => {
    const bookedAppointments = await Appointment.find();

    res.render('studentAppointment', {
        title: 'Booked Appointments',
        cssStylesheet: 'studentStyle.css',
        jsFile: 'studentScript.js',
        error: null,
        user: { role: 'student' }, // TEMPORARY PLACE HOLDER
        // eventually we will replace this with a real user, like: req.session.user
        bookedAppointments
    });
}
