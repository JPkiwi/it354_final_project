// add any models needed here

exports.getLandingPage = async (req, res) => {
    res.render('index',
    {
      error: null,
      title: 'ISU Learning Center',
      cssStylesheet: 'index.css',
      jsFile: 'index.js',
      user: req.session.user
  });
};

