const CenterOpen = require("../model/centerOpenSchedule");
const Course = require("../model/courseModel");
const { DEFAULT_WEEK_HOURS, DEFAULT_COURSES } = require("../config/defaultData");

// GET: Get the landing page of the web application, displays dynamic weekdays
exports.getLandingPage = async (req, res) => {
  try {
    let weekdays = await CenterOpen.find();
    let courses = await Course.find();

    // if there are no weekdays in MongoDB, then insert all the default week hours
    if (weekdays.length === 0) {
      weekdays = await CenterOpen.insertMany(DEFAULT_WEEK_HOURS);
    }

    // if there are no courses in MongoDB, then insert all the default courses
    // this assumes no tutors have been added yet and therefore no courses have been assigned. 
    if (courses.length === 0){
      courses = await Course.insertMany(DEFAULT_COURSES); 
    }

    res.render("index", {
      error: null,
      title: "ISU Learning Center",
      cssStylesheet: "index.css",
      jsFile: "index.js",
      user: req.session.user,
      weekdays,
      courses
    });
  } catch (err) {
    console.log("Landing page error:", err);
    res.render("index", {
      error: "Could not load center hours or courses accurately.",
      title: "ISU Learning Center",
      cssStylesheet: "index.css",
      jsFile: "index.js",
      user: req.session.user,
      weekdays: DEFAULT_WEEK_HOURS,
      courses: DEFAULT_COURSES
    });
  }
};
