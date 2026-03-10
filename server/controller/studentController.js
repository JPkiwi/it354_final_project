// const User = require("../model/userModel"); // will need eventually
const TutorShift = require("../model/tutorShiftModel");
const Course = require("../model/courseModel");
const mongoose = require("mongoose");

// GET: load the student index page with selection for course and day to view available appointments
exports.getStudentIndex = async (req, res) => {
    try {
        // get all courses for the dropdown
        const courses = await Course.find().sort({ courseName: 1 });

        res.render("studentIndex", {
            title: "Book an Appointment",
            cssStylesheet: "studentStyle.css",
            jsFile: "studentScript.js",
            error: null,
            form: {},
            user: req.session.user || { role: "student" },
            courses,
            availableShifts: []
        });
    } catch (err) {
        console.error(err);
        res.render("studentIndex", {
            title: "Book an Appointment",
            cssStylesheet: "studentIndex.css",
            jsFile: "studentScript.js",
            error: "Failed to load courses for student index page.",
            form: {},
            user: req.session.user || { role: "student" },
            courses: [],
            availableShifts: []
        });
    }
};

// POST: display available appointments for the day and course selected by the student
exports.viewAvailableAppointments = async (req, res) => {
    try {
        const { course, selectDay } = req.body;
        const courses = await Course.find().sort({ courseName: 1 });

        // convert courseId string to ObjectId to use in availableShifts query
        const courseId = new mongoose.Types.ObjectId(course); 
        
        // create a date range for the whole day (using UTC to avoid timezone issues)
        const startOfDay = new Date(selectDay);
        const endOfDay = new Date(selectDay);
        startOfDay.setUTCHours(0, 0, 0, 0);
        endOfDay.setUTCHours(23, 59, 59, 999);
        
        // pull shifts that are not booked and on the date and course the user selected
        let availableShifts = await TutorShift.aggregate([
            { $match: {isBooked: false, shiftDate: { $gte: startOfDay, $lte: endOfDay }} },
            { $lookup: {from: "users", localField: "tutorId", foreignField: "_id", as: "tutor"} },
            { $unwind: "$tutor" },
            { $match: {"tutor.tutorCourses": courseId } },
            { $lookup: {from: "courses", localField: "tutor.tutorCourses", foreignField: "_id", as: "courses"} },
            { $project: {shiftDate: 1, startTime: 1, endTime: 1, tutorId: "$tutor._id", fname: "$tutor.fname", lname: "$tutor.lname",
                courseName: { 
                    $arrayElemAt: [{
                        $map: {
                            input: {
                                $filter: {
                                    input: "$courses", 
                                    as: "course", 
                                    cond: { $eq: ["$$course._id", courseId] }
                                } 
                            },
                            as: "course",
                            in: "$$course.courseName"
                        }
                    }, 0]

                }}
            },
            { $sort: { shiftDate: 1, startTime: 1 } }
        ]);

        console.log("Available shifts:", availableShifts.length);

        if (availableShifts.length === 0) {
            return res.render("studentIndex", {
                title: "Book an Appointment",
                cssStylesheet: "studentStyle.css",
                jsFile: "studentScript.js",
                error: "There are no available appointments for that course and day.",
                form: { course: req.body.course, selectDay: req.body.selectDay },
                user: req.session.user || { role: "student" },
                courses,
                availableShifts: []
            });
        }
        else {
            res.render("studentIndex", {
                title: "Book an Appointment",
                cssStylesheet: "studentStyle.css",
                jsFile: "studentScript.js",
                error: null,
                form: { course: req.body.course, selectDay: req.body.selectDay },
                user: req.session.user || { role: "student" },
                courses,
                availableShifts
            });
        }  

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load available appointments." });
    }

};

