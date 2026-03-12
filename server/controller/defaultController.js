const CenterOpen = require("../model/centerOpenSchedule");

exports.getLandingPage = async (req, res) => {
  try {
    const weekdays = await CenterOpen.find();

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
      weekdays: []
    });
  }
};
