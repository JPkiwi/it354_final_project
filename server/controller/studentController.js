// const User = require("../model/userModel"); // will need eventually

// renders student index
exports.getStudentIndex = (req, res) => {
    res.render('studentIndex', {
        title: 'Student Index',
        cssStylesheet: 'studentIndex.css',
        jsFile: 'studentScript.js',
        error: null,
        user: { role: 'student' } // TEMPORARY PLACE HOLDER
        // eventually we will replace this with a real user, like: req.session.user
    });
};

