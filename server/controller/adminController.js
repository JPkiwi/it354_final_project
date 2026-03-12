// const User = require("../model/userModel"); // will need eventually
const Appointment = require("../model/appointmentModel");
const User = require("../model/userModel");
const Course = require("../model/courseModel");
const CenterOpen = require("../model/centerOpenSchedule");


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
            jsFile: 'adminAvailability.js', // will have js for this page at some point
            user: { role: 'admin' } // TEMPORARY PLACE HOLDER
            // eventually we will replace this with a real user, like: req.session.user
    });
};

// renders admin tutor index
exports.getAdminTutorIndex = async (req, res) => {
  try {
    // finding tutors in user collection
    const tutors = await User.find({ role: "tutor" });
    // retrieving courses (for when admin adds a tutor, they need to select the course(s) tutor will teach)
const courses = await Course.find();


    // open adminTutorIndex view
    res.render("adminTutorIndex", {
      error: null,
      title: "Admin Manage Tutors",
      cssStylesheet: "tutorIndex.css",
      jsFile: "tutorIndex.js",
      user: { role: "admin" },
      // passing list of tutors into view
      tutors: tutors,
      // passing courses into view 
      courses: courses
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
exports.getAdminStudentIndex = async(req, res) => {

try {
  // retrieving students from user collection
  const students = await User.find({role: "student"});
 res.render("adminStudentIndex", 
        {
            error: null,
            title: "Admin Manage Students",
            cssStylesheet: "studentIndex.css",
            jsFile: "studentIndex.js",
            user: { role: "admin" }, 
            // pass list of students into view 
            students: students
    });
} catch (err){
  res.render("adminStudentIndex", 
{
  error: "Could not load students",
  title: "Admin Manage Students",
            cssStylesheet: "studentIndex.css",
            jsFile: "studentIndex.js",
            user: { role: "admin" },
            // empty array when error occurs
            students: []
}
)}

};







// Changing a student's status from active to inactive or vice versa
exports.toggleStudentStatus = async (req, res) => {
  try {
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
        user: { role: "admin" },
        students: students
      });
    }

    // findin gthe selected user (student) by their id and role
    const student = await User.findOne({
      _id: studentId,
      role: "student"
    });

    // Makes sure student exists in db 
    if (!student) {
      return res.status(404).send("Student not found.");
    }

    // Toggle the students isActive value / update it
    await User.updateOne(
      { _id: studentId, role: "student" },
      { $set: { isActive: !student.isActive } }
    );

    // re-renders updated list (active vs. inactive) and redirects to the manage students page
    res.redirect("/adminStudentIndex");

  } 
    // in case of any erros, can log them and 500 for unfulfilled req 

  catch (err) {
    console.error(err);
    res.status(500).send("Could not update student status.");
  }
};




// Function to control ADDINg new user (student/tutor)from admnin
exports.addUser = async (req, res) => {
  try {
    // get data from what was entered in the modal
    const { fname, lname, email, password, role } = req.body;
    // 
    let { tutorCourses } = req.body;

    // make sure all fields were filled out
    if (!fname || !lname || !email || !password || !role) {
      return res.status(400).send("All fields are required.");
    }

    // Admin can only assign students and students, 
    // if we need to change to add another admin this is just temporary for now
    if (role !== "student" && role !== "tutor") {
      return res.status(400).send("Invalid role.");
    }

    // Security check to make sure that emails will not be dupliated 
    // (if a diff user already has email, return the 400/cannot process req)
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).send("A user with that email already exists.");
    }



    // if there is no tutor course selected when filling out "Add Tutor", 
    // then 400/cannot process req is sent and that at least one course must be selected
    if(role == "tutor"){
      if(!tutorCourses){
        return res.status(400).send("Course(s) must be selected to add a tutor")
      }
   
      // making sure selected course(s) is turned into an array bc model expects 
      // tutorCourses to be an array
if (!Array.isArray(tutorCourses)) {
  tutorCourses = [tutorCourses];
}

 }
 else {
  // students don't have tutor courses
  tutorCourses = [];
 }

    // when all above is passed/checked, create the new user 
    await User.create({
      fname: fname,
      lname: lname,
      email: email,
      passwordHash: password,
      role: role,
      isActive: true,
      tutorCourses: tutorCourses
    });

    // redirect back to the correct page after creating the user
    if (role === "student") {
      return res.redirect("/adminStudentIndex");
    } 
    // I only have the "Add User" for students right now, adding tutor very soon
    else {
      return res.redirect("/adminTutorIndex");
    }

  } 
  // in case of any erros, can log them and 500 for unfulfilled req 
  catch (err) {
    console.error(err);
    res.status(500).send("Could not add user.");
  }
};


// POST: Handles form submission to change weekday hours
exports.changeHours = async (req, res) => {
  try {
    const { weekday, centerOpenTime, centerCloseTime } = req.body;

    // make sure all fields were filled out
    if (!weekday || !centerOpenTime || !centerCloseTime) {
      return res.status(400).send("All fields are required.");
    }

    const openHour = Number(centerOpenTime.split(":")[0]); // Get open hour as an integer
    const closeHour = Number(centerCloseTime.split(":")[0]); // Get close hour as an integer
    const openMinute = Number(centerOpenTime.split(":")[1]); // Get open minute as an integer
    const closeMinute = Number(centerCloseTime.split(":")[1]); // Get close minute as an integer
    
    // make sure entered start time is less than entered end time
    if (openHour > closeHour) {
      return res.status(400).send("Open Time must be earlier than Close Time.");
    }

    // if center hours set to less than one-hour difference, then close the day
    if (((closeHour * 60 + closeMinute)-(openHour * 60 + openMinute)) < 60) {
      await CenterOpen.findOneAndUpdate({weekday: weekday}, { openTime: centerOpenTime, closeTime: centerCloseTime, isClosed: true });
    } else { // otherwise, update the weekday open and close hours, open the day
      await CenterOpen.findOneAndUpdate({weekday: weekday}, { openTime: centerOpenTime, closeTime: centerCloseTime, isClosed: false });
    }

    // re-render page once update completes
    res.render('adminAvailabilityIndex', 
    {
      error: null,
      title: 'Admin Availability',
      cssStylesheet: 'availabilityIndex.css',
      jsFile: 'adminAvailability.js', // will have js for this page at some point
      user: req.session.user
    });
  } catch (err) {
    console.log("Change hours failed:", err);
    res.render('adminAvailabilityIndex', 
    {
      error: 'Failed to change hours.',
      title: 'Admin Availability',
      cssStylesheet: 'availabilityIndex.css',
      jsFile: 'adminAvailability.js', // will have js for this page at some point
      user: req.session.user
    });
  }
};
