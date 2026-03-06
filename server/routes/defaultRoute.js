const express = require("express");
const route = express.Router();
// possibly need for future dynamic landing page
// const controller = require("../controller/defaultController");

// default directory, go to index/home page
route.get('/', (req, res) => { 
  res.render('index',
    {
      error: null,
      title: 'ISU Learning Center',
      cssStylesheet: 'index.css',
      jsFile: null
  });
});

module.exports = route;