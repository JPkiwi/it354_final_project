
// renders tutor index
exports.getTutorIndex = (req, res) => {
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

    // if auth user but not a tutor, send to login page
    if (req.session.user.role !== "tutor") {
        return res.render('login', 
          {
            title: 'Login Page',
            cssStylesheet: 'login.css',
            jsFile: null,
            error: "Access denied. Only tutors can view this page.",
            user: req.session.user
        });
    }

    // render tutor page
    res.render('tutorIndex', 
        {
            error: null,
            title: 'Tutor Appointments',
            cssStylesheet: 'tutorStyle.css',
            jsFile: 'tutorScript.js',
            user: req.session.user,
            bookedAppointments: [],
            appointmentsLoaded: false
    });
};
