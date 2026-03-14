// const User = require("../model/userModel"); // will need eventually
const Appointment = require("../model/appointmentModel");
const User = require("../model/userModel");
const Course = require("../model/courseModel");
const tutorShift = require("../model/tutorShiftModel")

// -------------------------------------------------------------------------------------------

// renders ADMIN INDEX
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
      user: req.session.user,
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
      user: req.session.user,
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


// -------------------------------------------------------------------------------------------

// renders ADMIN AVAILABILITY INDEX
exports.getAdminAvailabilityIndex = (req, res) => {
  res.render('adminAvailabilityIndex',
    {
      error: null,
      title: 'Admin Availability',
      cssStylesheet: 'availabilityIndex.css',
      jsFile: null, // will have js for this page at some point
      user: req.session.user
    });
};

// -------------------------------------------------------------------------------------------

// renders ADMIN TUTOR INDEX
exports.getAdminTutorIndex = async (req, res) => {
  try {
    // finding tutors in user collection
    const tutors = await User.find({ role: "tutor" });
    const activeTutors = await User.find({ role: "tutor", isActive: true });

    // retrieving courses (for when admin adds a tutor, they need to select the course(s) tutor will teach)
    const courses = await Course.find();
    const today = new Date().toISOString().split("T")[0];



    // open adminTutorIndex view
    res.render("adminTutorIndex", {
      error: null,
      title: "Admin Manage Tutors",
      cssStylesheet: "tutorIndex.css",
      jsFile: "tutorIndex.js",
      user: req.session.user,
      // passing list of tutors into view
      tutors,
      // passing courses into view 
      activeTutors,
      courses,
      today
    });
  } catch (err) {

    // prints erroe to console
    console.error(err);
    const today = new Date().toISOString().split("T")[0];

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
      today
    });
  }
};

// -------------------------------------------------------------------------------------------

// Changing a TUTOR'S STATUS FROM ACTIVE TO INACTIVE or vice versa
exports.toggleTutorStatus = async (req, res) => {
  try {
    // retrieving selected tutor ID from submitted form (selected Tutor)
    const tutorId = req.body.selectedTutor;

    const today = new Date().toISOString().split("T")[0];

    // checks if tutor was selected -> security measure, if missing,
    // re-renders page and stops function
    if (!tutorId) {
      const tutors = await User.find({ role: "tutor" });
      const activeTutors = await User.find({ role: "tutor", isActive: true });
      const today = new Date().toISOString().split("T")[0];
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
        today
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
    const tutors = await User.find({ role: "tutor" });
    const courses = await Course.find();
    const activeTutors = await User.find({ role: "tutor", isActive: true });
    const today = new Date().toISOString().split("T")[0];


    res.render("adminTutorIndex", {
      error: "Please select a tutor first.",
      title: "Admin Manage Tutors",
      cssStylesheet: "tutorIndex.css",
      jsFile: "tutorIndex.js",
      user: req.session.user,
      tutors,
      activeTutors,
      courses,
      today
    });

  }
};

// -------------------------------------------------------------------------------------------


// handling submitted form data for ASSIGNING TUTOR HOURS
exports.assignTutorHours = async (req, res) => {
  try {
    // retrieve hours entered into form 
    const { tutorId, shiftDate, startTime, endTime } = req.body;
    let today = new Date();

    // ensure all fields in form are filled out -> if all fields in modal are NOT filled out, then :
    if (!tutorId || !shiftDate || !startTime || !endTime) {
      // reload tutors for page/dropdown 
      const tutors = await User.find({ role: "tutor" });
      const activeTutors = await User.find({ role: "tutor", isActive: true });
      const courses = await Course.find();
      today = new Date().toISOString().split("T")[0];

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
        today
      });
    } // end of if(!tutorId || !shiftDate etc...)

    // make sure selected tutor exists in db/role is a tutor
    const tutor = await User.findOne({ _id: tutorId, role: "tutor" });

    // if a match is NOT found 
    if (!tutor) {
      // (reloading data page needs again)
      const tutors = await User.find({ role: "tutor" });
      const courses = await Course.find();
      const activeTutors = await User.find({ role: "tutor", isActive: true });
      today = new Date().toISOString().split("T")[0];

      // re-render page to show message that the selected tutor was not found
      return res.render("adminTutorIndex", {
        error: "Tutor not found",
        title: "Admin Manage Tutors",
        cssStylesheet: "tutorIndex.css",
        jsFile: "tutorIndex.js",
        user: req.session.user,
        tutors,
        activeTutors,
        courses,
        today
      });

    }// end of if(!tutor)


    // now work with the times (startTime & endTime)

    // splitting start time (should only need the 0 index (hour index) if we're not going to worry about minutes?)
    // I can still check minutes just in case??
    const startHr = parseInt(startTime.split(":")[0]);
    const startMin = parseInt(startTime.split(":")[1]);
    // now for the submitted endTime from form 
    const endHr = parseInt(endTime.split(":")[0]);
    const endMin = parseInt(endTime.split(":")[1]);


    // ensure the endTime is later than startTime
    if (endHr < startHr || (endHr === startHr && endMin <= startMin)) {
      const tutors = await User.find({ role: "tutor" });
      const courses = await Course.find();
      today = new Date().toISOString().split("T")[0];
      const activeTutors = await User.find({ role: "tutor", isActive: true });


      // re-render page/show error message
      return res.render("adminTutorIndex", {
        error: "End time must be later than start time",
        title: "Admin Manage Tutors",
        cssStylesheet: "tutorIndex.css",
        jsFile: "tutorIndex.js",
        user: req.session.user,
        tutors,
        activeTutors,
        courses,
        today
      });
    }


    // shifts are stored in 1-hr blocks, verification 
    if (startMin !== 0 || endMin !== 0) {
      const tutors = await User.find({ role: "tutor" });
      today = new Date().toISOString().split("T")[0];
      const courses = await Course.find();
      const activeTutors = await User.find({ role: "tutor", isActive: true });


      // re-render page/show error message
      return res.render("adminTutorIndex", {
        error: "Shift times must be exactly on the hour",
        title: "Admin Manage Tutors",
        cssStylesheet: "tutorIndex.css",
        jsFile: "tutorIndex.js",
        user: req.session.user,
        tutors,
        activeTutors,
        courses,
        today
      });

    }


    // initialize array (to store shift blocks) 
    const shiftsToCreate = [];

    // counters for log
    let addedShifts = 0;
    let skippedShifts = 0;

    // comparing the start/end time to existing tutor shift 



    console.log("START", startTime);

    const earlierShifts = await tutorShift.find({
    tutorId: tutorId,
    shiftDate: new Date(shiftDate),
    startTime: { $lt: startTime }
});

    console.log(earlierShifts);

    if (earlierShifts.length > 0){

      // removing the earlier shifts 
      for (let i = 0; i < earlierShifts.length; i++) {
        // await tutorShift.deleteOne({earlierShifts[i]});
        await tutorShift.deleteOne({ _id: earlierShifts[i]._id });
        // console.log(earlierShifts[i]);
      }

    }



    const laterShifts = await tutorShift.find({
    tutorId: tutorId,
    shiftDate: new Date(shiftDate),
    endTime: { $gte: endTime }
  });

  console.log(laterShifts);

    if (laterShifts.length > 0 ) {
      // removing the later shifts 
      for (let i = 0; i < laterShifts.length; i++) {
        await tutorShift.deleteOne({ _id: laterShifts[i]._id });

      }

    }



    // taking each hr #, making sure it's always two-digits when storing (example -> get 9 hour, store as 09: )
    // adding "00" at end to make it full time string storing in db 
    // loop through the hours in selected range 
    for (let hour = startHr; hour < endHr; hour++) {
      const blockStart = `${String(hour).padStart(2, "0")}:00`
      const blockEnd = `${String(hour + 1).padStart(2, "0")}:00`;

      // check if the shift block exists 
      const existingShift = await tutorShift.findOne({
        tutorId: tutorId,
        shiftDate: new Date(shiftDate),
        startTime: blockStart,
        endTime: blockEnd
      });



      // if the shift exists, ignore it/skip (using continue; )
      // "continue;" stops current iteration, re-processes to next
      if (existingShift) {
        skippedShifts++;
        continue;

      }


      // if shift block does not exist, add to the shiftsToCreate array 
      shiftsToCreate.push({
        tutorId: tutorId,
        assignedByAdminId: req.session.user._id,
        shiftDate: new Date(shiftDate),
        startTime: blockStart,
        endTime: blockEnd,
        isBooked: false
      });

      addedShifts++;

    }// END OF FOR  



    // logging how many shifts were added and if there were any skipped (already-exisitng) shifts 
    // not necessary, just so we can test
    console.log(`Shifts added: ${addedShifts}`);
    console.log(`Shifts skipped (duplicates): ${skippedShifts}`);


    // if shiftsToCreate is empty (ALL shift blocks have already been added)
    if (shiftsToCreate.length === 0) {
      const tutors = await User.find({ role: "tutor" });
      today = new Date().toISOString().split("T")[0];
      const courses = await Course.find();
      const activeTutors = await User.find({ role: "tutor", isActive: true });



      // re-render page/show error message
      return res.render("adminTutorIndex", {
        error: "All selected shift blocks already exist",
        title: "Admin Manage Tutors",
        cssStylesheet: "tutorIndex.css",
        jsFile: "tutorIndex.js",
        user: req.session.user,
        tutors,
        activeTutors,
        courses,
        today
      });
    }


    // inserting the shifts to database :) 
    await tutorShift.insertMany(shiftsToCreate);
    res.redirect("/adminTutorIndex");

  } //end of try
  catch (err) {
    console.error(err);

    const tutors = await User.find({ role: "tutor" });
    const courses = await Course.find();
    today = new Date().toISOString().split("T")[0];
    const activeTutors = await User.find({ role: "tutor", isActive: true });

    res.render("adminTutorIndex", {
      error: "Could not assign tutor shifts.",
      title: "Admin Manage Tutors",
      cssStylesheet: "tutorIndex.css",
      jsFile: "tutorIndex.js",
      user: req.session.user,
      tutors,
      activeTutors,
      courses,
      today
    });

  }// end of catch 

};
// -------------------------------------------------------------------------------------------


// RENDERS ADMIN STUDENT INDEX
exports.getAdminStudentIndex = async (req, res) => {

  try {
    // retrieving students from user collection
    const students = await User.find({ role: "student" });
    res.render("adminStudentIndex",
      {
        error: null,
        title: "Admin Manage Students",
        cssStylesheet: "studentIndex.css",
        jsFile: "studentIndex.js",
        user: req.session.user,
        // pass list of students into view 
        students: students
      });
  } catch (err) {
    res.render("adminStudentIndex",
      {
        error: "Could not load students",
        title: "Admin Manage Students",
        cssStylesheet: "studentIndex.css",
        jsFile: "studentIndex.js",
        user: req.session.user,
        // empty array when error occurs
        students: []
      }
    )
  }

};


// -------------------------------------------------------------------------------------------

// Changing a STUDENT'S STATUS FROM ACTIVE TO INACTIVE or vice versa
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
        user: req.session.user,
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

    const students = await User.find({ role: "student" });

    res.render("adminStudentIndex", {
      error: "Could not update student status.",
      title: "Admin Manage Students",
      cssStylesheet: "studentIndex.css",
      jsFile: "studentIndex.js",
      user: req.session.user,
      students
    });
  }
};


// -------------------------------------------------------------------------------------------


// Function to control ADDING NEW USER (student/tutor)from admnin
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
    if (role == "tutor") {
      if (!tutorCourses) {
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