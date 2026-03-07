// const User = require("../model/userModel"); // will need eventually


// renders tutor index
exports.getTutorIndex = (req, res) => {
    res.render('tutorIndex', 
        {
            error: null,
            title: 'Tutor Appointments',
            cssStylesheet: 'tutorStyle.css',
            jsFile: 'tutorScript.js',
            user: { role: 'tutor' } // TEMPORARY PLACE HOLDER
            // eventually we will replace this with a real user, like: req.session.user
    });
};
