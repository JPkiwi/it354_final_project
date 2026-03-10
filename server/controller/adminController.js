// const User = require("../model/userModel"); // will need eventually
const Appointment = require("../model/appointmentModel");
const User = require("../model/userModel");
const Course = require("../model/courseModel");



// renders admin index
exports.getAdminIndex = async (req, res) => {
  try {
// finding all appointments in db
const appointments = await Appointment.find()
  // replace studentId ref with full student doc
.populate("studentId")
  // replace tutorShiftId ref with full tutor shift doc
  // also replace tutorId w/ full user doc 
  // getting full info instead of just Id's
  .populate({
    path: "tutorShiftId",
    populate: {
      path: "tutorId",
      model: "User"
    }
  });

  // find all courses in db
  const courses = await Course.find();

  // render adminIndex view 
    res.render("adminIndex", {
      error: null,
      title: "Admin Page",
      cssStylesheet: "adminIndex.css",
      jsFile: "adminIndex.js",
      user: { role: "admin" },
      // sending appointments and courses to EJS view
      appointments: appointments,
      courses: courses,

      // default values for form fields
      // so a crash does not occur -> form fields always 
      // have something defined even without submitted data
      eligibleTutorShifts: [],
    studentFName: "",
    studentLName: "",
    date: "",
    time: "",
    course: ""
    });

  } 
  catch (err) {
    console.error(err);
    // render same page, with error message & empty arrays passed 
    // to ensure page does not break
    res.render("adminIndex", {
      error: "Could not load appointments.",
      title: "Admin Page",
      cssStylesheet: "adminIndex.css",
      jsFile: "adminIndex.js",
      user: { role: "admin" },
      appointments: [],
      courses: [],
      // default form values
    eligibleTutorShifts: [],
    studentFName: "",
    studentLName: "",
    date: "",
    time: "",
    course: ""
    });
  }
};

// renders admin availability index
exports.getAdminAvailabilityIndex = (req, res) => {
    res.render('adminAvailabilityIndex', 
        {
            error: null,
            title: 'Admin Availability',
            cssStylesheet: 'availabilityIndex.css',
            jsFile: null, // will have js for this page at some point
            user: { role: 'admin' } // TEMPORARY PLACE HOLDER
            // eventually we will replace this with a real user, like: req.session.user
    });
};

// renders admin tutor index
exports.getAdminTutorIndex = async (req, res) => {
  try {
    // finding tutors in user collection
    const tutors = await User.find({ role: "tutor" });

    // open adminTutorIndex view
    res.render("adminTutorIndex", {
      error: null,
      title: "Admin Manage Tutors",
      cssStylesheet: "tutorIndex.css",
      jsFile: "tutorIndex.js",
      user: { role: "admin" },
      // passing list of tutors into view
      tutors: tutors
    });
  } catch (err) {
    // prints erroe to console
    console.error(err);
    // even w/ error, page will still render
    res.render("adminTutorIndex", {
      error: "Could not load tutors.",
      title: "Admin Manage Tutors",
      cssStylesheet: "tutorIndex.css",
      jsFile: "tutorIndex.js",
      user: { role: "admin" },
      // passing empty array instead of tutor data for error
      tutors: []
    });
  }
};



// Changing a tutor's status from active to inactive or vice versa

exports.toggleTutorStatus = async (req, res) => {
  try {
    // retrieving selected tutor ID from submitted form (selected Tutor)
    const tutorId = req.body.selectedTutor;

    // checks if tutor was selected -> security measure, if missing,
    // re-renders page and stops function
    if (!tutorId) {
      const tutors = await User.find({ role: "tutor" });

      return res.render("adminTutorIndex", {
        // tells user to select tutor 
        error: "Please select a tutor first.",
        title: "Admin Manage Tutors",
        cssStylesheet: "tutorIndex.css",
        jsFile: "tutorIndex.js",
        user: { role: "admin" },
        tutors: tutors
      });
    }

    // searching for one specific tutor, where role is tutor & id matches selected tutor
    const tutor = await User.findOne({ _id: tutorId, role: "tutor" });

    // if a matching tutor doesn't exist, return "not found" & stops function
    if (!tutor) {
      return res.status(404).send("Tutor not found.");
    }

    // Finds tutor by Id/role 
    // sets isActive to opposite of current value
    await User.updateOne(
      { _id: tutorId, role: "tutor" },
      { $set: { isActive: !tutor.isActive } }
    );

    // reloads page/show's updated active status
    res.redirect("/adminTutorIndex");
  } catch (err) {
    // security measure, if failure
    console.error(err);
    res.status(500).send("Could not update tutor status.");
  }
};



// renders admin student index
exports.getAdminStudentIndex = (req, res) => {
    res.render('adminStudentIndex', 
        {
            error: null,
            title: 'Admin Manage Students',
            cssStylesheet: 'studentIndex.css',
            jsFile: 'studentIndex.js',
            user: { role: 'admin' } // TEMPORARY PLACE HOLDER
            // eventually we will replace this with a real user, like: req.session.user
    });
};

