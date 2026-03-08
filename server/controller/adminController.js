// const User = require("../model/userModel"); // will need eventually

// renders admin index
exports.getAdminIndex = (req, res) => {
     // console.log(req.body);
    res.render('adminIndex', 
        {
            error: null,
            title: 'Admin Page',
            cssStylesheet: 'adminIndex.css',
            jsFile: 'adminIndex.js',
            user: { role: 'admin' } // TEMPORARY PLACE HOLDER
            // eventually we will replace this with a real user, like: req.session.user
    });
};

// renders admin availability index
exports.getAdminAvailabilityIndex = (req, res) => {
    res.render('adminAvailabilityIndex', 
        {
            error: null,
            title: 'Admin Availability',
            cssStylesheet: 'availabilityIndex.css',
            jsFile: null, // will have js for this page at some point
            user: { role: 'admin' } // TEMPORARY PLACE HOLDER
            // eventually we will replace this with a real user, like: req.session.user
    });
};

// renders admin tutor index
exports.getAdminTutorIndex = (req, res) => {
    res.render('adminTutorIndex', 
        {
            error: null,
            title: 'Admin Manage Tutors',
            cssStylesheet: 'tutorIndex.css',
            jsFile: 'tutorIndex.js',
            user: { role: 'admin' } // TEMPORARY PLACE HOLDER
            // eventually we will replace this with a real user, like: req.session.user
    });
};

// renders admin student index
exports.getAdminStudentIndex = (req, res) => {
    res.render('adminStudentIndex', 
        {
            error: null,
            title: 'Admin Manage Students',
            cssStylesheet: 'studentIndex.css',
            jsFile: 'studentIndex.js',
            user: { role: 'admin' } // TEMPORARY PLACE HOLDER
            // eventually we will replace this with a real user, like: req.session.user
    });
};
