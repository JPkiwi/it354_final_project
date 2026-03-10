const Appointment = require("../model/appointmentModel");
const TutorShift = require("../model/tutorShiftModel");


// POST: handle bookAppointment form submission
exports.bookAppointment = async (req, res) => {
  try {
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
        user: req.session.user || { role: "student" },
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

    res.redirect("/studentIndex");
  } catch (err) {
    console.error(err);
    res.render("studentAppointment", {
      title: "Book an Appointment",
      cssStylesheet: "studentStyle.css",
      jsFile: "studentScript.js",
      error: "Failed to book appointment.",
      user: req.session.user || { role: "student" },
      availableShifts: [],
      bookedAppointments: [],
    });
  }
};


// GET: display the student's booked appointments
exports.getBookedAppointments = async (req, res) => {
  try {
    // get any booked appointments
    const bookedAppointments = await Appointment.find({ studentId: req.session.user._id });

    // render studentAppointment page with bookedAppointments
    res.render("studentAppointment", {
      title: "Booked Appointments",
      cssStylesheet: "studentStyle.css",
      jsFile: "studentScript.js",
      error: null,
      user: req.session.user || { role: "student" }, // TEMPORARY PLACE HOLDER
      // eventually we will replace this with a real user, like: req.session.user
      bookedAppointments,
    });
  } catch (err) {
    console.error(err);
    res.render("studentAppointment", {
      title: "Booked Appointments",
      cssStylesheet: "studentStyle.css",
      jsFile: "studentScript.js",
      error: "Failed to book appointment.",
      user: req.session.user || { role: "student" },
      availableShifts: [],
      bookedAppointments: [],
    });
  }
};
