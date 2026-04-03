const Appointment = require("../model/appointmentModel");
const User = require("../model/userModel");
const Course = require("../model/courseModel");
const tutorShift = require("../model/tutorShiftModel");
const centerOpen = require("../model/centerOpenSchedule");
const centerClosedSchedule = require("../model/centerClosedSchedule");
const bcrypt = require('bcrypt');
const { trusted } = require("mongoose");

//-----------------------------------------------

async function getClosedWeekdays() {
  const centerSchedule = await centerOpen.find();

  const weekdayMap = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6
  };

  const closedWeekdays = [];

  centerSchedule.forEach(day => {
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
      return res.render('login',
        {
          title: 'Login Page',
          cssStylesheet: 'login.css',
          jsFile: null,
          error: "User not logged in.",
          user: null
        });
    }

    // if auth user but not a admin, send to login page
    if (req.session.user.role !== "admin") {
      return res.render('login',
        {
          title: 'Login Page',
          cssStylesheet: 'login.css',
          jsFile: null,
          error: "Access denied. Only admins can view this page.",
          user: null
        });
    }
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
      appointments,
      courses,
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
exports.getAdminAvailabilityIndex = async (req, res) => {
  try{

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

    // if auth user but not a admin, send to login page
    if (req.session.user.role !== "admin") {
      return res.render('login',
        {
          title: 'Login Page',
          cssStylesheet: 'login.css',
          jsFile: null,
          error: "Access denied. Only admins can view this page.",
          user: null
        });
      }

      const weekdays = await centerOpen.find();

      res.render('adminAvailabilityIndex',
      {
        error: null,
        title: 'Admin Availability',
        cssStylesheet: 'availabilityIndex.css',
        jsFile: 'adminAvailability.js',
        user: req.session.user,
        weekdays
      });
    } catch(err){
      res.render('adminAvailabilityIndex',
      {
        error: "Could not load page",
        title: 'Admin Availability',
        cssStylesheet: 'availabilityIndex.css',
        jsFile: 'adminAvailability.js',
        user: req.session.user,
        weekdays: []
      });
    }
}

// -------------------------------------------------------------------------------------------

// renders ADMIN TUTOR INDEX
exports.getAdminTutorIndex = async (req, res) => {
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

    // if auth user but not a admin, send to login page
    if (req.session.user.role !== "admin") {
      return res.render('login',
        {
          title: 'Login Page',
          cssStylesheet: 'login.css',
          jsFile: null,
          error: "Access denied. Only admins can view this page.",
          user: null
        });
    }
    // finding tutors in user collection
    const tutors = await User.find({ role: "tutor" });
    const activeTutors = await User.find({ role: "tutor", isActive: true });
    // retrieving courses (for when admin adds a tutor, they need to select the course(s) tutor will teach)
    const courses = await Course.find();
    const today = new Date().toLocaleDateString("en-CA");
    const centerSchedule = await centerOpen.find();

    const weekdayMap = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6
    };

    const closedWeekdays = [];

    centerSchedule.forEach(day => {
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
      shifts: [],
      closedWeekdays,
      selectedTutorId: null,
      selectedShiftDate: "",
      availableShiftBlocks: [],
      openAssignTutorModal: false,
      openClearTutorModal: false
    });
  } catch (err) {

    // prints error to console
    console.error(err);
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
      shifts: [],
      closedWeekdays: [],
      selectedTutorId: null,
      selectedShiftDate: "",
      availableShiftBlocks: [],
      openAssignTutorModal: false,
      openClearTutorModal: false
    });
  }
};

// -------------------------------------------------------------------------------------------

// Changing a TUTOR'S STATUS FROM ACTIVE TO INACTIVE or vice versa
exports.toggleTutorStatus = async (req, res) => {
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

    // if auth user but not a admin, send to login page
    if (req.session.user.role !== "admin") {
      return res.render('login',
        {
          title: 'Login Page',
          cssStylesheet: 'login.css',
          jsFile: null,
          error: "Access denied. Only admins can view this page.",
          user: null
        });
    }
    // retrieving selected tutor ID from submitted form (selected Tutor)
    const tutorId = req.body.selectedTutor;
    const centerSchedule = await centerOpen.find();

    const weekdayMap = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6
    };

    const closedWeekdays = [];

    centerSchedule.forEach(day => {
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
        shifts: [],
        openClearTutorModal: false
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
    return res.redirect("/adminTutorIndex");
  } catch (err) {
    // logging error for debugging
    console.error(err);

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
      shifts: [],
      selectedTutorId: req.body.tutorId || null,
      selectedShiftDate: req.body?.shiftDate || "",
      availableShiftBlocks: [],
      openAssignTutorModal: false,
      openClearTutorModal: false,
    });

  }
};

// -------------------------------------------------------------------------------------------

// EDITING USER from admin
exports.editUser = async (req, res) => {
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
 
      // if auth user but not a admin, send to login page
      if (req.session.user.role !== "admin") {
        return res.render('login',
          {
            title: 'Login Page',
            cssStylesheet: 'login.css',
            jsFile: null,
            error: "Access denied. Only admins can view this page.",
            user: null
        });
      }

    // get data from what was entered in the modal
    const { fname, lname, email, password, role, userId, isActive} = req.body;
    let tutorCourses = [];

    // make sure all necessary fields were filled out
    if (!fname || !lname || !email || !role) {
      return res.status(400).send("All fields are required.");
    }

    // Security check to make sure that emails will not be dupliated 
    // Checks all emails EXCEPT the current user email
    const existingUser = await User.findOne({ email: email, _id: { $ne: userId} });
    if (existingUser) {
      return res.status(400).send("A user with that email already exists.");
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
        return res.status(400).send("Course(s) must be selected to edit a tutor.")
      }

    }

    // checks to see if password field is empty
    // IF the password field is NOT empty, hash new password
    // ELSE, keep the existing password by fetching it from the database
    let passwordHash;
    if (password && password.trim() !== "") {
        const saltRounds = 10;
        passwordHash = await bcrypt.hash(password, saltRounds);
    } 
    else {
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
      tutorCourses: tutorCourses
    });

    // redirect back to the correct page after editing the user
    if (role === "student") {
      return res.redirect("/adminStudentIndex");
    }
    else {
      return res.redirect("/adminTutorIndex");
    }

  }

  // in case of any errors, can log them and 500 for unfulfilled req 
  catch (err) {
    console.error(err);
    res.status(500).send("Could not edit user.");
  }
};

// -----------------------------------------


// handling submitted form data for ASSIGNING TUTOR HOURS
exports.assignTutorHours = async (req, res) => {
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

    // if auth user but not a admin, send to login page
    if (req.session.user.role !== "admin") {
      return res.render('login',
        {
          title: 'Login Page',
          cssStylesheet: 'login.css',
          jsFile: null,
          error: "Access denied. Only admins can view this page.",
          user: null
        });
    }

    // retrieve info entered from form
    const { tutorId, shiftDate, action } = req.body;
    // get shiftBlocks chosen by admin (checkbox)
    let { shiftBlocks } = req.body;
    let today = new Date().toLocaleDateString("en-CA");
    const centerSchedule = await centerOpen.find();


    // for flatpickr (for disabling days to choose from)-> creates mapping between the weekday names & their number
    const weekdayMap = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6
    };

    const closedWeekdays = [];

    centerSchedule.forEach(day => {
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
        shifts: []
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
        shifts: []
      });

    }// end of if(!tutor)




    // convert submitted shift date string into js date object
    // map(Number) to convert each item in array to number
    const [year, month, day] = shiftDate.split("-").map(Number);

    // "month - 1" --> subtract 1 because JavaScript months are 0-indexed (0 = January)
    // form gives 03 (March), need to pass 2 in new date for finding weekday
    const selectedDate = new Date(year, month - 1, day);

    // determine weekday name from selected date
    const weekdayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ];

    // getDay() returns day of WEEK
    // determine weekday name for selected shift date
    const weekday = weekdayNames[selectedDate.getDay()];

    // find normal center open hours for that weekday
    const centerOpenDay = await centerOpen.findOne({ weekday });

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
        shifts: []
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
    if(validStartHr >= validEndHr){
      return res.render("adminTutorIndex", {
        // returning an error that the center is closed that day/shifts can't be scheduled 
        error: "No full 1-hour shifts are available for the date and tutor selected",
        title: "Admin Manage Tutors",
        cssStylesheet: "tutorIndex.css",
        jsFile: "tutorIndex.js",
        user: req.session.user,
        tutors,
        activeTutors,
        courses,
        today,
        closedWeekdays,
        shifts: [],
        selectedTutorId: tutorId,
        selectedShiftDate: shiftDate,
        openAssignTutorModal: true,
        availableShiftBlocks: [],
      });
    }


    // converting 24hr format to 12hr format with the am and pm labels
    function formatTo12Hour(timeStr){
      const [hourStr, minute] = timeStr.split(":");
      let hour = parseInt(hourStr, 10);
      const ampm = hour >= 12 ? "PM" : "AM";

      hour = hour %12;
      if (hour === 0) hour = 12;

      return `${hour}:${minute} ${ampm}`;
    }


    // finding existing tutor Shifts for specified chosen date
    // log
    const startOfDay = new Date (year, month -1, day, 0,0,0,0);
    const endOfDay = new Date (year, month -1, day, 23, 59, 59, 999);

    const existingTutorShifts = await tutorShift.find({
      tutorId: tutorId,
      shiftDate: {
        $gte: startOfDay, 
        $lte: endOfDay
      }
    });


    // log new Set
    const takenShiftBlocks = new Set();

    // loop through all shifts tutor already has scheduled for that day
    existingTutorShifts.forEach((shift) => {
      takenShiftBlocks.add(`${shift.startTime}-${shift.endTime}`);
    });

    const availableShiftBlocks = [];

    // loop through each hr between the center open/and the close time
    for (let hour = validStartHr; hour <validEndHr; hour++){
      const blockStart = `${String(hour).padStart(2, "0")}:00`;
      const blockEnd = `${String(hour + 1).padStart(2, "0")}:00`;
      const blockValue = `${blockStart}-${blockEnd}`;

      // only display shift block IF tutor does NOT already have it scheduled for them
      if(!takenShiftBlocks.has(blockValue)){
        availableShiftBlocks.push({
          value: blockValue,
          label: `${formatTo12Hour(blockStart)} - ${formatTo12Hour(blockEnd)}`
        })
      }
    }

    // view button 
    if(action === "view"){
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
        shifts: [],
        openClearTutorModal: false
      })
    }
    // assign button 
    if(action === "assign"){
      // no boxes are checked for shifts 
      if(!shiftBlocks){
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
          shifts: [],
          openClearTutorModal: false
        })
      }


    // Make sure the shiftBlocks is an array
    if (!Array.isArray(shiftBlocks)){
      shiftBlocks = [shiftBlocks];
    }

    // count for how many of the shifts ar created & skipped(ignored)
    let createdCount = 0; 
    let skippedCount = 0;

    // loop through the selected shifts 
    for (const block of shiftBlocks){
      const [startTime, endTime] = block.split("-");

      // make sure the startTime and the endTime of the shift block(s) exist
      // validation check ! 
      if(!startTime || !endTime){
        skippedCount++;
        continue;
      }

      // split the times into hr & minute pieces
      const[startHrStr, startMinStr] = startTime.split(":");
      const [endHrStr, endMinStr] = endTime.split(":");

      // convert the strings to numers
      const startHr = parseInt(startHrStr, 10);
      const endHr = parseInt(endHrStr, 10);
      const startMin = parseInt(startMinStr, 10);
      const endMin = parseInt(endMinStr, 10);

      // ensure minutes are zero (that hours are on the block)
      if(startMin !== 0 || endMin !== 0){
        skippedCount++;
        continue;
      }

      // making sure chosen blocks are one-hour blocks
      if(endHr !== startHr + 1){
        skippedCount++;
        continue;
      }

      //make sure block is inside available (center open) range 
      if(startHr < validStartHr || endHr > validEndHr){
        skippedCount++;
        continue;
      }

      // validation check for dpublicate shifts (making sure duplicates are not chosen)
      const existingShift = await tutorShift.findOne({
        tutorId,
        shiftDate: selectedDate,
        startTime, 
        endTime
      });

      // if shift to be added already exists, skip 
      if(existingShift){
        skippedCount++;
        continue;
      }


      await tutorShift.create({
        tutorId,
        assignedByAdminId: req.session.user._id,
        shiftDate: selectedDate, 
        startTime, 
        endTime
      });

      createdCount++;
    }


    // messages about shift creation amount AFTER submission 
    let message = "";
    if(createdCount > 0 && skippedCount >0){
      message = `${createdCount} shift(s) added. ${skippedCount} shift(s) skipped.`
    } else if (createdCount > 0){
      message = `${createdCount} shift(s) successfully added.`
    } else{
      message = "No shifts were added."
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
      shifts: [],
      openClearTutorModal: false
        });

        // add fallback(?)

    }


  } //end of try
  catch (err) {
    console.error(err);

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
      shifts: [],
      openAssignTutorModal: false,
      selectedTutorId: req.body.tutorId || null,
      selectedShiftDate: req.body?.shiftDate || "",
      availableShiftBlocks: [],
      openClearTutorModal: false

    });

  }// end of catch 

};





// -------------------------------------------------------------------------------------------

//POST: show tutor's scheduled shifts after admin selects tutor 
exports.adminViewTutorShedule = async (req, res) => {
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
 
      // if auth user but not a admin, send to login page
      if (req.session.user.role !== "admin") {
        return res.render('login',
          {
            title: 'Login Page',
            cssStylesheet: 'login.css',
            jsFile: null,
            error: "Access denied. Only admins can view this page.",
            user: null
        });
      }
    
    const tutorId = req.body.tutorId || req.body.selectedTutor;
    const centerSchedule = await centerOpen.find();

    const weekdayMap = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6
    };

    const closedWeekdays = [];

    centerSchedule.forEach(day => {
      if (day.isClosed) {
        closedWeekdays.push(weekdayMap[day.weekday]);
      }
    });

    //if the user did not select a tutor first, return an error message
    if (!tutorId) {
      return res.status(400).send("Tutor ID is required.");
    }

    //get the shifts for the selected tutor, populate tutor info, sort by date and time
    const shifts = await tutorShift.find({ tutorId: tutorId }).populate('tutorId', 'fname lname').sort({ shiftDate: 1, startTime: 1 });

    // Load data needed to render the main tutor management page with the selected tutor's shifts
    const tutors = await User.find({ role: "tutor" });
    const activeTutors = await User.find({ role: "tutor", isActive: true });
    const courses = await Course.find();
    const today = new Date().toISOString().split("T")[0];

    res.render("adminTutorIndex", {
      error: null,
      title: "Admin Manage Tutors",
      cssStylesheet: "tutorIndex.css",
      jsFile: "tutorIndex.js",
      user: req.session.user,
      tutors,
      activeTutors,
      courses,
      today,
      shifts,
      closedWeekdays,
      selectedTutorId: req.body.tutorId || null,
      selectedShiftDate: req.body?.shiftDate || "",
      availableShiftBlocks: [],
      openAssignTutorModal: false,
      openClearTutorModal: false

    });


  } catch (err) {
    console.error(err);
    res.render("adminTutorIndex", {
      error: "Could not load tutor shifts.",
      title: "Admin Manage Tutors",
      cssStylesheet: "tutorIndex.css",
      jsFile: "tutorIndex.js",
      user: req.session.user,
      tutors: [],
      activeTutors: [],
      courses: [],
      today: new Date().toISOString().split("T")[0],
      shifts: [],
      closedWeekdays: [],
      selectedTutorId: req.body.tutorId || null,
      selectedShiftDate: req.body?.shiftDate || "",
      availableShiftBlocks: [],
      openAssignTutorModal: false,
      openClearTutorModal: false
    });
  }
};

// -------------------------------------------------------------------------------------------

// REMOVING ALL TUTOR SHIFTS from specified day (/clearing tutor hours) 
exports.clearTutorHours = async (req, res) => {
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

    // if auth user but not a admin, send to login page
    if (req.session.user.role !== "admin") {
      return res.render('login',
        {
          title: 'Login Page',
          cssStylesheet: 'login.css',
          jsFile: null,
          error: "Access denied. Only admins can view this page.",
          user: null
        });
    }
    // retrieving tutorId and shiftDate chosen by admin
    const { tutorId, shiftDate, action } = req.body;
    let {selectedShiftIds} = req.body;

    const tutors = await User.find({role: "tutor"});
    const activeTutors = await User.find({role: "tutor", isActive: true});
    const courses = await Course.find();
    const today = new Date().toLocaleDateString("en-CA");
    const centerSchedule = await centerOpen.find(); 
    

    const weekdayMap = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6
    };

    const closedWeekdays = [];

    centerSchedule.forEach(day => {
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
        shifts: [],
        selectedTutorId: req.body.tutorId || null,
        selectedShiftDate: req.body?.shiftDate || "",
        availableShiftBlocks: [],
        openAssignTutorModal: false,
        openClearTutorModal: true

      });
    }

    // prase selected date 
    const [year, month, day] = shiftDate.split("-").map(Number); 
    const startOfDay = new Date(year, month -1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month -1, day, 23, 59, 59, 999);
    const nextDay = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

    // viewing the active shifts 
    if(action === "view"){
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
      const shifts = (await tutorShift.find({
    tutorId,
    shiftDate: {
      $gte: startOfDay,
      $lt: endOfDay
    }
  }).sort({ startTime: 1 })).map(shift => ({
    ...shift.toObject(),
    startTime: formatTo12Hour(shift.startTime),
    endTime: formatTo12Hour(shift.endTime)
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
        shifts,
        selectedTutorId: req.body.tutorId || null,
        selectedShiftDate: req.body?.shiftDate || "",
        availableShiftBlocks: [],
        openAssignTutorModal: false,
        openClearTutorModal: true
      });
    }


    // remove the checked shifts 
    if (action === "removeSelected") {
      if (!selectedShiftIds) {
        const shifts = await tutorShift.find({
          tutorId,
          shiftDate: {
            $gte: startOfDay,
            $lte: endOfDay
          }
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
        shifts,
        selectedTutorId: req.body.tutorId || null,
        selectedShiftDate: req.body?.shiftDate || "",
        availableShiftBlocks: [],
        openAssignTutorModal: false,
        openClearTutorModal: true
      });
    }

    if(!Array.isArray(selectedShiftIds)){
      selectedShiftIds = [selectedShiftIds];
    }

    await tutorShift.deleteMany({
      _id: { $in: selectedShiftIds },
      tutorId, 
      shiftDate: {
        $gte: startOfDay, 
        $lte: endOfDay
      }
    });
    return res.redirect("/adminTutorIndex");
  } // end of remove checked shifts

  // clearing full selected day 
  if (action === "clearAll"){
    const deletedShifts = await tutorShift.deleteMany({
      tutorId,
      shiftDate: {
        $gte: startOfDay, 
        $lte: endOfDay
      }
    });

    if( deletedShifts.deletedCount === 0){
      return res.render("adminTutorIndex", {
        error: "No shift assigned for this tutor on ${shiftDate}; no shifts removed.", 
        title: "Admin Manage Tutors",
        cssStylesheet: "tutorIndex.css",
        jsFile: "tutorIndex.js",
        user: req.session.user,
        tutors,
        activeTutors,
        courses,
        today,
        closedWeekdays,
        shifts: [],
        selectedTutorId: req.body.tutorId || null,
        selectedShiftDate: req.body?.shiftDate || "",
        availableShiftBlocks: [],
        openAssignTutorModal: false,
        openClearTutorModal: true
      });
    }
    return res.redirect("/adminTutorIndex");

  }

  return res.render("adminTutorIndex", {
        error: "Action was invalid", 
        title: "Admin Manage Tutors",
        cssStylesheet: "tutorIndex.css",
        jsFile: "tutorIndex.js",
        user: req.session.user,
        tutors,
        activeTutors,
        courses,
        today,
        closedWeekdays,
        shifts: [],
        selectedTutorId: req.body.tutorId || null,
        selectedShiftDate: req.body?.shiftDate || "",
        availableShiftBlocks: [],
        openAssignTutorModal: false,
        openClearTutorModal: true
      });


  } catch (err) {
    console.error("Error clearing tutor hours:", err);
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
      shifts: [],
      selectedTutorId: req.body.tutorId || null,
      selectedShiftDate: req.body?.shiftDate || "",
      availableShiftBlocks: [],
      openAssignTutorModal: false,
      openClearTutorModal: true

    });
  }
};



// --------------------------------------------------------------------------------------------

// RENDERS ADMIN STUDENT INDEX
exports.getAdminStudentIndex = async (req, res) => {

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

    // if auth user but not a admin, send to login page
    if (req.session.user.role !== "admin") {
      return res.render('login',
        {
          title: 'Login Page',
          cssStylesheet: 'login.css',
          jsFile: null,
          error: "Access denied. Only admins can view this page.",
          user: null
        });
    }
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

    // if auth user but not a admin, send to login page
    if (req.session.user.role !== "admin") {
      return res.render('login',
        {
          title: 'Login Page',
          cssStylesheet: 'login.css',
          jsFile: null,
          error: "Access denied. Only admins can view this page.",
          user: null
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
        students: students
      });
    }

    // finding the selected user (student) by their id and role
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


// ADDING NEW USER (student/tutor)from admin
exports.addUser = async (req, res) => {
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

    // if auth user but not a admin, send to login page
    if (req.session.user.role !== "admin") {
      return res.render('login',
        {
          title: 'Login Page',
          cssStylesheet: 'login.css',
          jsFile: null,
          error: "Access denied. Only admins can view this page.",
          user: null
        });
    }
    // get data from what was entered in the modal
    const { fname, lname, email, password, role, sourcePage } = req.body;
    const tutors = await User.find({ role: "tutor" });
    const users = await User.find();
    const courses = await Course.find();
    const activeTutors = await User.find({role: "tutor", isActive: true});
    const today = new Date().toLocaleDateString("en-CA");
    // 
    let { tutorCourses } = req.body;

    // make sure all fields were filled out
    if (!fname || !lname || !email || !password || !role) {
  return res.status(400).render('adminAddUser', {
    title: 'Add User',
    error: "All fields are required.",
    formData: req.body,
    user: req.session.user
  });
}

    // Admin can only assign students and tutors, 
    // if we need to change to add another admin this is just temporary for now
    if (role !== "student" && role !== "tutor") {
      return res.status(400).render('adminAddUser', {
    title: 'Add User',
    error: "Invalid role.",
    formData: req.body,
    user: req.session.user
  });
}


// FIX LATER, ADD FOR STUDENT?? SOURCEPAGE ERROR
    // Security check to make sure that emails will not be dupliated 
    // (if a diff user already has email, return the 400/cannot process req)
    const existingUser = await User.findOne({ email: email });
    const closedWeekdays = await getClosedWeekdays();

    if (existingUser) {
      return res.status(400).render("adminTutorIndex", {
    title: 'Add User',
    cssStylesheet: 'tutorIndex.css',
    jsFile: "tutorIndex.js",
    error: "A user with that email already exists.",
    formData: req.body,
    user: req.session.user,
    tutors,
    users,
    courses,
    activeTutors,
    today,
    shifts: [],
    closedWeekdays,
    selectedTutorId: null,
    selectedShiftDate: "",
    availableShiftBlocks: [],
    openAssignTutorModal: false
  });
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

    // hashing the passwords
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // when all above is passed/checked, create the new user
    await User.create({
      fname: fname,
      lname: lname,
      email: email,
      passwordHash: passwordHash,
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
      return res.redirect(`/${sourcePage}`);
    }

  }
  // in case of any errors, can log them and 500 for unfulfilled req 
  catch (err) {
    console.error(err);
    res.status(500).send("Could not add user.");
  }
};

// -----------------------------------------


// POST: Handles form submission to change weekday hours
exports.changeHours = async (req, res) => {
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

    // if auth user but not a admin, send to login page
    if (req.session.user.role !== "admin") {
      return res.render('login',
        {
          title: 'Login Page',
          cssStylesheet: 'login.css',
          jsFile: null,
          error: "Access denied. Only admins can view this page.",
          user: null
        });
      }
      
    const { weekday, centerOpenTime, centerCloseTime, closeWeekdayDropdown } = req.body;

    let weekdays = await centerOpen.find();

    // make sure all required fields were filled out if weekday is set to open
    if ((!weekday || !centerOpenTime || !centerCloseTime) && closeWeekdayDropdown === "No") {
      return res.render('adminAvailabilityIndex', {
        error: "All fields are required.",
        title: 'Admin Availability',
        cssStylesheet: 'availabilityIndex.css',
        jsFile: 'adminAvailability.js',
        user: req.session.user,
        weekdays
      });
    }

    // if closeWeekdayDropdown is set to "Yes", then set the specified weekday to closed
    if (closeWeekdayDropdown === "Yes") {
      await centerOpen.findOneAndUpdate({ weekday: weekday }, { $set: { isClosed: true } });
    } else { // otherwise, set hours for specified weekday and set isClosed to false
      const openHour = Number(centerOpenTime.split(":")[0]); // Get open hour as an integer
      const closeHour = Number(centerCloseTime.split(":")[0]); // Get close hour as an integer
      const openMinute = Number(centerOpenTime.split(":")[1]); // Get open minute as an integer
      const closeMinute = Number(centerCloseTime.split(":")[1]); // Get close minute as an integer
    
      // make sure minutes are set to 00
      if (openMinute !== 0 || closeMinute !== 0) {
        return res.render('adminAvailabilityIndex', {
          error: "Minutes must be 00. Please enter on the hour mark only.",
          title: 'Admin Availability',
          cssStylesheet: 'availabilityIndex.css',
          jsFile: 'adminAvailability.js',
          user: req.session.user,
          weekdays
        });
      }

      // make sure entered start time is less than entered end time
      if (openHour > closeHour) {
        return res.render('adminAvailabilityIndex', {
          error: "Open Time must be earlier than Close Time.",
          title: 'Admin Availability',
          cssStylesheet: 'availabilityIndex.css',
          jsFile: 'adminAvailability.js',
          user: req.session.user,
          weekdays
        });
      }

      // make sure center hours cannot be set to the same time
      if (openHour === closeHour) {
        return res.render('adminAvailabilityIndex', {
          error: "Cannot set equal open time and close time.",
          title: 'Admin Availability',
          cssStylesheet: 'availabilityIndex.css',
          jsFile: 'adminAvailability.js',
          user: req.session.user,
          weekdays
        });
      }

      // update MongoDB with new times and set isClosed to false
      await centerOpen.findOneAndUpdate({ weekday: weekday }, { $set: { isClosed: false ,openTime: centerOpenTime, closeTime: centerCloseTime} });
    }
    
    // get newly updated weekdays
    weekdays = await centerOpen.find();
    
    // re-render page once update completes
    res.render('adminAvailabilityIndex', 
    {
      error: null,
      title: 'Admin Availability',
      cssStylesheet: 'availabilityIndex.css',
      jsFile: 'adminAvailability.js',
      user: req.session.user,
      weekdays
    });
  } catch (err) {
    console.log("Change hours failed:", err);
    res.render('adminAvailabilityIndex', 
    {
      error: 'Failed to change hours.',
      title: 'Admin Availability',
      cssStylesheet: 'availabilityIndex.css',
      jsFile: 'adminAvailability.js',
      user: req.session.user,
      weekdays: []
    });
  }
};
