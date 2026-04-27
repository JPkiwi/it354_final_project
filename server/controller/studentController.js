const User = require("../model/userModel");
const TutorShift = require("../model/tutorShiftModel");
const Course = require("../model/courseModel");
const mongoose = require("mongoose");
const Appointment = require("../model/appointmentModel");
const { sendEmail } = require("../services/emailService");
const { studentCancellationTemplate } = require("../../views/templates/appointmentEmail");
const { deleteCalendarEvent } = require('../services/calendarService');
const NotificationLog = require("../model/notificationLog");
const { formatTo12Hour } = require("../services/timeService");


// GET: load the student index page with selection for course and day to view available appointments
exports.getStudentIndex = async (req, res) => {
    try {
        // if not an auth user, send to login page
        if (!req.session.user) {
            return res.render('login',
                {
                    title: 'Login Page',
                    cssStylesheet: 'login.css',
                    jsFile: 'login.js',
                    error: "User not logged in.",
                    user: null,
                });
        }

        // if auth user but not a student, send to login page
        if (req.session.user.role !== "student") {
            return res.render('login',
                {
                    title: 'Login Page',
                    cssStylesheet: 'login.css',
                    jsFile: 'login.js',
                    error: "Access denied. Only students can view this page.",
                    user: req.session.user,
                });
        }

        // get all courses for the dropdown
        const courses = await Course.find().sort({ courseName: 1 });

        const error = req.session.error || null;
        delete req.session.error; // clear the session error after displaying it once

        res.render("studentIndex", {
            title: "Book an Appointment",
            cssStylesheet: "studentStyle.css",
            jsFile: "studentScript.js",
            error,
            form: {},
            user: req.session.user,
            courses,
            availableShifts: [],
            formatTo12Hour
        });
    } catch (err) {
        res.render("studentIndex", {
            title: "Book an Appointment",
            cssStylesheet: "studentIndex.css",
            jsFile: "studentScript.js",
            error: "Failed to load courses for student index page.",
            form: {},
            user: req.session.user,
            courses: [],
            availableShifts: [],
            formatTo12Hour

        });
    }
};

// POST: display available appointments for the day and course selected by the student
exports.viewAvailableAppointments = async (req, res) => {
    try {
        // if not an auth user, send to login page
        if (!req.session.user) {
            return res.render('login',
                {
                    title: 'Login Page',
                    cssStylesheet: 'login.css',
                    jsFile: 'login.js',
                    error: "User not logged in.",
                    user: null,
                });
        }

        // if auth user but not a student, send to login page
        if (req.session.user.role !== "student") {
            return res.render('login',
                {
                    title: 'Login Page',
                    cssStylesheet: 'login.css',
                    jsFile: 'login.js',
                    error: "Access denied. Only students can view this page.",
                    user: req.session.user,
                });
        }

        const { course, selectDay } = req.body;
        const courses = await Course.find().sort({ courseName: 1 });

        // convert courseId string to ObjectId to use in availableShifts query
        const courseId = new mongoose.Types.ObjectId(course);

        //get the current date to compare to shift dates and only show future appointments
        const currentDate = new Date();

        // create a date range for the whole day (using UTC to avoid timezone issues)
        const startOfDay = new Date(selectDay);
        const endOfDay = new Date(selectDay);
        startOfDay.setUTCHours(0, 0, 0, 0);
        endOfDay.setUTCHours(23, 59, 59, 999);

        // allow same day appointments but not past day appointments
        if (endOfDay < currentDate) {
            return res.render("studentIndex", {
                title: "Book an Appointment",
                cssStylesheet: "studentStyle.css",
                jsFile: "studentScript.js",
                error: "You cannot view appointments for a past day.",
                form: { course, selectDay },
                user: req.session.user,
                courses,
                availableShifts: [],
                formatTo12Hour

            });
        }
        else {
            // pull shifts that are not booked and on the date and course the user selected
            let availableShifts = await TutorShift.aggregate([
                { $match: { isBooked: false, shiftDate: { $gte: startOfDay, $lte: endOfDay } } }, // filter for unbooked shifts on the selected day
                { $lookup: { from: "users", localField: "tutorId", foreignField: "_id", as: "tutor" } }, // join with user collection to get tutor details for filtering tutors by course
                { $unwind: "$tutor" },
                { $match: { "tutor.tutorCourses": courseId } }, // filter for tutors that have the user selected course in their tutorCourses array
                { $lookup: { from: "courses", localField: "tutor.tutorCourses", foreignField: "_id", as: "courses" } },
                {
                    $project: { // format result with only necessary details for displaying available shifts - date, start/end time, course name
                        shiftDate: 1, startTime: 1, endTime: 1,
                        courseName: {
                            $arrayElemAt: [{ // used to get the courseName from the tutorCourses array that belong to a tutor that matches the courseId selected by the user
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

                        }
                    }
                },
                { $sort: { shiftDate: 1, startTime: 1 } }
            ]);

            // if there are no available shifts for the selected course and day, send an error message and keep the form filled. 
            // Otherwise, render the page with the available shifts and keep the form filled.
            if (availableShifts.length === 0) {
                return res.render("studentIndex", {
                    title: "Book an Appointment",
                    cssStylesheet: "studentStyle.css",
                    jsFile: "studentScript.js",
                    error: "There are no available appointments for that course and day.",
                    form: { course: req.body.course, selectDay: req.body.selectDay },
                    user: req.session.user,
                    courses,
                    availableShifts: [],
                    formatTo12Hour

                });
            }
            else {
                res.render("studentIndex", {
                    title: "Book an Appointment",
                    cssStylesheet: "studentStyle.css",
                    jsFile: "studentScript.js",
                    error: null,
                    form: { course: req.body.course, selectDay: req.body.selectDay },
                    user: req.session.user,
                    courses,
                    availableShifts,
                    formatTo12Hour

                });
            }
        }

    } catch (err) {
        return res.status(500).render("studentIndex", {
            title: "Book an Appointment",
            cssStylesheet: "studentStyle.css",
            jsFile: "studentScript.js",
            error: "Failed to load available appointments.",
            form: { course: req.body.course, selectDay: req.body.selectDay },
            user: req.session.user,
            courses: [],
            availableShifts: []
        });
    }

};



exports.cancelAppointment = async (req, res) => {
    try{
        // if not an auth user, send to login page
        if (!req.session.user) {
            return res.render('login',
                {
                    title: 'Login Page',
                    cssStylesheet: 'login.css',
                    jsFile: 'login.js',
                    error: "User not logged in.",
                    user: null,
                });
        }

        // if auth user but not a student, send to login page
        if (req.session.user.role !== "student") {
            return res.render('login',
                {
                    title: 'Login Page',
                    cssStylesheet: 'login.css',
                    jsFile: 'login.js',
                    error: "Access denied. Only students can view this page.",
                    user: req.session.user,
                });
        }

        const appointmentId = req.params.appointmentId;

        // make sure selected appointment belongs to correct user id (logged in student) 
        const appointment = await Appointment.findOne({
            _id: appointmentId, 
            studentId: req.session.user._id
        }).populate({
            path: 'tutorShiftId',
            populate: {
                path: 'tutorId',
                select: 'fname lname'
            } 
        });
           

        // check if appointment selected exists in db
        if(!appointment){
            const bookedAppointments = await Appointment.find({ studentId: req.session.user._id });

            return res.render("studentAppointment", {
                title: "Booked Appointments",
                cssStylesheet: "studentStyle.css",
                jsFile: "studentScript.js",
                error: "Appointment was not found.",
                user: req.session.user,
                bookedAppointments

            });
        }

         // change tutorshift to open (isBooked: false) 
        if(appointment.tutorShiftId){
            await TutorShift.findByIdAndUpdate(appointment.tutorShiftId, {
                isBooked: false
            });
        }

        // not fully deleting appt --> instead setting status to "cancelled" so appointment is still 
        // able to be queried (admin audit log/admin view cancelled appointments/etc.) 
        await Appointment.findByIdAndUpdate(appointmentId, {
            appointmentStatus: "cancelled"
        });

        // ──────────── Delete Google Calendar event ──────────────────
        try {
            if (appointment.calendarEventId) {
                const admin = await User.findOne({ role: "admin" });
                if (admin?.googleTokens) {
                    await deleteCalendarEvent(admin.googleTokens, appointment.calendarEventId);
                }
            }
        } catch (calendarErr) {
            return res.render("studentAppointment", {
                title: "Booked Appointments",
                cssStylesheet: "studentStyle.css",
                jsFile: "studentScript.js",
                error: "Calendar event deletion failed.",
                user: req.session.user,
                bookedAppointments

            });
        }
        // ────────────────────────────────────────────────────────────

        // send cancellation confirmation email to student and CC admin
        let emailFailed = false;
        try {
            await sendEmail({
            to: req.session.user.email,
            cc: process.env.GMAIL_ADMIN, // CC admin
            subject: "Appointment Cancellation",
            html: studentCancellationTemplate({
                studentName: req.session.user.fname,
                tutorName: `${appointment.tutorShiftId.tutorId.fname} ${appointment.tutorShiftId.tutorId.lname}`,
                date: appointment.appointmentDate.toLocaleDateString('en-US', { timeZone: 'UTC' }),
                time: `${appointment.startTime} - ${appointment.endTime}`,
                course: appointment.course
                })
            });
        
        } catch (emailErr) {
            console.error("Student cancellation email sending error.");
            emailFailed = true; // flag to indicate email sending failed
        }
        
        // log the cancellation action in NotificationLog collection
        try {
            // Notification log for when student cancels their appointment
            await NotificationLog.create({
                appointmentId: appointment._id,
                recipientUserId: req.session.user._id,
                appointmentDate: appointment.appointmentDate,
                notificationType: "STUDENT_CANCEL_APPT"
            });
        } catch (err) {
            console.error("NotificationLog STUDENT_CANCEL_APPT failed.");
        }
        
        // log if email failed to send in NotificationLog collection
        if (emailFailed) {
            req.session.error = "Appointment cancelled, but failed to send confirmation email."; // store email failure message in session to display on next page load
            try {
                await NotificationLog.create({
                    appointmentId: appointment._id,
                    recipientUserId: req.session.user._id,
                    appointmentDate: appointment.appointmentDate,
                    notificationType: "SEND_EMAIL_FAILED",
              });
        
            } catch (err) {
              console.error("NotificationLog SEND_EMAIL_FAILED for student cancel appointment failed.");
            }
          }


         // reload page 
        return res.redirect('/studentAppointment');
    } // end of try 
    catch(err){
        //console.error("Error cancelling appointment:", err);
        const bookedAppointments = await Appointment.find({
            studentId: req.session.user._id
        });
        res.render("studentAppointment", {
            title: "Booked Appointments",
            cssStylesheet: "studentStyle.css",
            jsFile: "studentScript.js",
            error: "Could not cancel appointment.",
            user: req.session.user,
            bookedAppointments
        });
    }
}
