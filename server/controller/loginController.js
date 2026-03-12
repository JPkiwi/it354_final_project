const bcrypt = require('bcrypt');
const User = require('../model/userModel');

async function loginUser(req, res) {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        // checks to see if this user exists
        if (!user) {
            return res.render('login', {error: 'Invalid email/password.'});
            // NEED TO FLESH OUT
        }
    

        // checking for a password match
        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
            res.render('login', {error: 'Invalid email/password.'});
            // NEED TO FLESH OUT
        }

        // stores user in session
        req.session.user = user;

        // checks user's role, redirects them to their corresponding index page
        if (user.role === "admin") {
            res.redirect('/adminIndex');
        }
        else if (user.role === "tutor") {
            res.redirect('/tutorIndex');
        }
        else {
            res.redirect('/studentIndex');
        }
    }
    catch (err) {
        console.error(err);
        // NEED TO FLESH OUT
    }
}

module.exports = { loginUser };