const Appointment = require("../model/appointmentModel");
const User = require("../model/userModel");
const Course = require("../model/courseModel");
const tutorShift = require("../model/tutorShiftModel");
const centerOpen = require("../model/centerOpenSchedule");
const centerClosedSchedule = require("../model/centerClosedSchedule");
const bcrypt = require('bcrypt');

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
      // sending appointments and courses to EJS view
      appointments,
      courses,

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
        weekdays
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
      today
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
      today
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
      today
    });

  }
};

// -------------------------------------------------------------------------------------------


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

    // retrieve hours entered into form 
    const { tutorId, shiftDate, startTime, endTime } = req.body;
    let today = new Date().toLocaleDateString("en-CA");

    // ensure all required form fields were submitted
    if (!tutorId || !shiftDate || !startTime || !endTime) {
      // reload tutors for page/dropdown 
      const tutors = await User.find({ role: "tutor" });
      const activeTutors = await User.find({ role: "tutor", isActive: true });
      const courses = await Course.find();
      today = new Date().toLocaleDateString("en-CA");

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

    // make sure selected tutor exists in db & has tutor role
    const tutor = await User.findOne({ _id: tutorId, role: "tutor" });

    // if tutor was not found
    if (!tutor) {
      // reload page data needed for re-rendering
      const tutors = await User.find({ role: "tutor" });
      const courses = await Course.find();
      const activeTutors = await User.find({ role: "tutor", isActive: true });
      today = new Date().toLocaleDateString("en-CA");

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

    // split the submitted start time and end time into hour & minute pieces
    const startHr = parseInt(startTime.split(":")[0], 10);
    const startMin = parseInt(startTime.split(":")[1], 10);

    const endHr = parseInt(endTime.split(":")[0], 10);
    const endMin = parseInt(endTime.split(":")[1], 10);


    // ensure the endTime is later than startTime
    // prevent zero-length shift range 
    if (endHr < startHr || (endHr === startHr && endMin <= startMin)) {
      const tutors = await User.find({ role: "tutor" });
      const courses = await Course.find();
      today = new Date().toLocaleDateString("en-CA");
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


    // shift validation: Shifts must start & end exactly on the hour because 
    // they are stored in 1-hour blocks
    if (startMin !== 0 || endMin !== 0) {
      const tutors = await User.find({ role: "tutor" });
      today = new Date().toLocaleDateString("en-CA");
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
    const centerOpenDay = await centerOpen.findOne({ weekday: weekday });

    // if center is fully closed that weekday, shift creation not allowed
    if (!centerOpenDay || centerOpenDay.isClosed) {
      const tutors = await User.find({ role: "tutor" });
      const activeTutors = await User.find({ role: "tutor", isActive: true });
      const courses = await Course.find();
      today = new Date().toLocaleDateString("en-CA");

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
        today
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



    // adjust the requested shift range so it stays within valid center hours 
    // example: if center is open 3-5pm & admin requests 2-6pm, 
    // adjustedStartHr becomes 3, adjusted enderHr becomes 5

    // comparing hour admin requested (startHr) and validStartHr -> prevents starting before center opens & ending after it closes
    const adjustedStartHr = Math.max(startHr, validStartHr);
    const adjustedEndHr = Math.min(endHr, validEndHr);

    // if the requested shift does NOT overlap with any full valid center-hour block, reject it
    // ex: center open 2:45 - 3:15 --> will be replaced later with center closure check(?)
    if (adjustedStartHr >= adjustedEndHr) {
      const tutors = await User.find({ role: "tutor" });
      const activeTutors = await User.find({ role: "tutor", isActive: true });
      const courses = await Course.find();
      today = new Date().toLocaleDateString("en-CA");

      return res.render("adminTutorIndex", {
        error: "Center is closed during the selected time block",
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


    // formatting error message when a shift is selected outside of center hours 
    // (ex: "22:00" as "10:00 PM")
    function formatHour(hour) {
      const ampm = hour >= 12 ? "PM" : "AM";
      let displayHour = hour % 12;

      if (displayHour === 0) {
        displayHour = 12;
      }

      return `${displayHour}:00 ${ampm}`;
    }


    // keep track of whether some requested hours were outside center hours
    let outsideCenterHoursMessage = "";

    // example: if admin requests 1 PM - 7 PM but center is only open 2 PM - 5 PM,
    // message explains which requested time blocks were outside valid center hours

    // (*if admin request was too early AND too late)
    if (startHr < adjustedStartHr && endHr > adjustedEndHr) {
      outsideCenterHoursMessage =
        `Some requested shift blocks were unavailable before ${formatHour(adjustedStartHr)} and after ${formatHour(adjustedEndHr)}.`;
    } else if (startHr < adjustedStartHr) {
      outsideCenterHoursMessage =
        `Shift block unavailable before ${formatHour(adjustedStartHr)}.`;
    } else if (endHr > adjustedEndHr) {
      outsideCenterHoursMessage =
        `Shift block unavailable after ${formatHour(adjustedEndHr)}.`;
    }



    // initialize array (to store shift blocks) 
    const shiftsToCreate = [];

    // counters for optional debugging/logging
    let addedShifts = 0;
    let skippedShifts = 0;




    // comparing requested time range to existing tutor shifts 

    // Find all shift records for tutor on selected date 
    // where the shift starts earlier than the newly requested start time
    const earlierShifts = await tutorShift.find({
      tutorId: tutorId,
      shiftDate: new Date(shiftDate),
      startTime: { $lt: startTime }
    });

    if (earlierShifts.length > 0) {
      // removing the earlier shifts 
      for (let i = 0; i < earlierShifts.length; i++) {
        await tutorShift.deleteOne({ _id: earlierShifts[i]._id });
      }
    }

    // Find all shifts for tutor on selected date, 
    // where the shift ends at or after the newly requested end time.
    const laterShifts = await tutorShift.find({
      tutorId: tutorId,
      shiftDate: new Date(shiftDate),
      endTime: { $gte: endTime }
    });

    if (laterShifts.length > 0) {
      // removing the later shifts 
      for (let i = 0; i < laterShifts.length; i++) {
        await tutorShift.deleteOne({ _id: laterShifts[i]._id });
      }
    }


    // loop through each hour in the valid adjusted range
    // build full HH:MM time strings for each 1-hour shift block
    // padding time strings --> 9 hr = 09, min always 00 
    for (let hour = adjustedStartHr; hour < adjustedEndHr; hour++) {
      const blockStart = `${String(hour).padStart(2, "0")}:00`;
      const blockEnd = `${String(hour + 1).padStart(2, "0")}:00`;

      // check if the shift block exists 
      const existingShift = await tutorShift.findOne({
        tutorId: tutorId,
        shiftDate: new Date(shiftDate),
        startTime: blockStart,
        endTime: blockEnd
      });

      // if this shift block already exists, skip it and continue to the next hour block
      // "continue;" stops current iteration, re-processes to next iteration
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

    }// END OF FOR LOOP 



    // logging how many shifts were added and if there were any skipped (already-exisitng) shifts 
    // not necessary, just so we can test
    // console.log(`Shifts added: ${addedShifts}`);
    // console.log(`Shifts skipped (duplicates): ${skippedShifts}`);
    // console.log(outsideCenterHoursMessage);


    // if shiftsToCreate is empty (ALL shift blocks have already been added)
    if (shiftsToCreate.length === 0) {
      const tutors = await User.find({ role: "tutor" });
      today = new Date().toLocaleDateString("en-CA");
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


    // inserting all new shift blocks into database
    await tutorShift.insertMany(shiftsToCreate);


    // if some requested hours were outside center hours,
    // re-render page to show warning message
    if (outsideCenterHoursMessage) {
      const tutors = await User.find({ role: "tutor" });
      const activeTutors = await User.find({ role: "tutor", isActive: true });
      const courses = await Course.find();
      today = new Date().toLocaleDateString("en-CA");

      return res.render("adminTutorIndex", {
        error: outsideCenterHoursMessage,
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

    // else, successful redirect
    return res.redirect("/adminTutorIndex");

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
      today
    });

  }// end of catch 

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
    const { tutorId, shiftDate } = req.body;

    if (!tutorId || !shiftDate) {
      const tutors = await User.find({ role: "tutor" });
      const activeTutors = await User.find({ role: "tutor", isActive: true });
      const courses = await Course.find();
      const today = new Date().toLocaleDateString("en-CA");

      return res.render("adminTutorIndex", {
        error: "Please select a tutor and date first.",
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
    // deleting the specified shifts from chosen date/storing in deletedShifts
    const deletedShifts = await tutorShift.deleteMany({
      tutorId,
      shiftDate: new Date(shiftDate)
    })

    // if no shifts were deleted, return that no shifts were assigned for the tutor
    if (deletedShifts.deletedCount === 0) {
      const tutors = await User.find({ role: "tutor" });
      const activeTutors = await User.find({ role: "tutor", isActive: true });
      const courses = await Course.find();
      const today = new Date().toLocaleDateString("en-CA");

      return res.render("adminTutorIndex", {
        error: `No shift was assigned for this tutor on ${shiftDate}; no shifts were removed.`,
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
    // redirect to page
    res.redirect("/adminTutorIndex");

  } catch (err) {
    console.error("Error clearing tutor hours:", err);
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
      today
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
      return res.redirect("/adminTutorIndex");
    }

  }
  // in case of any erros, can log them and 500 for unfulfilled req 
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
      weekdays
    });
  }
};
