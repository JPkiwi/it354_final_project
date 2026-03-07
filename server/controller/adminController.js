// const User = require("../model/userModel"); // will need eventually

// renders admin index
exports.getAdminIndex = (req, res) => {
     // console.log(req.body);
    res.render('adminIndex', 
        {
            error: null,
            title: 'Admin Page',
            cssStylesheet: 'adminIndex.css',
            jsFile: 'adminIndex.js'
    });
};
