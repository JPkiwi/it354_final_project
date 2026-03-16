const CenterOpen = require("../model/centerOpenSchedule");
const DEFAULT_WEEK_HOURS = require("../config/defaultWeekHours");

// GET: Get the landing page of the web application, displays dynamic weekdays
exports.getLandingPage = async (req, res) => {
  try {
    let weekdays = await CenterOpen.find();

    // if there are no weekdays in MongoDB, then insert all the default week hours
    if (weekdays.length === 0) {
      weekdays = await CenterOpen.insertMany(DEFAULT_WEEK_HOURS);
    }

    res.render("index", {
      error: null,
      title: "ISU Learning Center",
      cssStylesheet: "index.css",
      jsFile: "index.js",
      user: req.session.user,
      weekdays
    });
  } catch (err) {
    console.log("Landing page error:", err);
    res.render("index", {
      error: "Could not load center hours accurately.",
      title: "ISU Learning Center",
      cssStylesheet: "index.css",
      jsFile: "index.js",
      user: req.session.user,
      weekdays: DEFAULT_WEEK_HOURS
    });
  }
};
