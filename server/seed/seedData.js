// MARK: Remove evenutally: Models and temporary test data
// instances of User and TutorShift
// imports the Mongoose models, validates data, and inserts into MongoDB collection
// const User = require("../server/model/userModel");
// const TutorShift = require("../server/model/tutorShiftModel");
// const Course = require("../server/model/courseModel");
// const Appointment = require("../server/model/appointmentModel");

// TEMPORARY TEST DATA BELOW

// NOTE: IF YOU WANT THE LOGIN FUNCTIONALITY TO WORK FOR TEST DATA, YOU MUST USE A HASHED PASSWORD !!!
// The password checker specifically checks hashed passwords, if you used unhashed passwords IT WILL FAIL

// use this to create a password for each user you want to test:
// const hashedPassword1 = await bcrypt.hash('use an actual password here', 10);
// ^ the "10" refers to the length of the string that the password will be salted with.

// app.get("/seed", async (req, res) => {
//   try {
//     // for hashing passwords
//     const bcrypt = require("bcrypt");

//     // create courses
//     const course179 = await Course.create({ courseName: "IT179" });
//     const course168 = await Course.create({ courseName: "IT168" });


//     // FOR TESTING PASSWORD HASHING with the "adminHash" admin below:
//     const hashedPassword1 = await bcrypt.hash('adminHashPass1234', 10);
//     // admin with a hashed password
//       const adminHash = await User.create({
//       role: "admin",
//       fname: "Admin",
//       lname: "Hashed",
//       email: "adminHash@ilstu.edu",
//       passwordHash: hashedPassword1,
//     });


//     const hashedPassword2 = await bcrypt.hash('tutorHashPass1234', 10);
//     // tutor with a hashed password
//       const tutorHash = await User.create({
//       role: "tutor",
//       fname: "Tutor",
//       lname: "Hashed",
//       email: "tutorHash@ilstu.edu",
//       passwordHash: hashedPassword2,
//       tutorCourses: [course179._id, course168._id],
//     });

//     const hashedPassword3 = await bcrypt.hash('studentHashPass1234', 10);
//     // student with a hashed password
//       const studentHash = await User.create({
//       role: "student",
//       fname: "Student",
//       lname: "Hashed",
//       email: "studentHash@ilstu.edu",
//       passwordHash: hashedPassword3,
//     });


//     // create a test tutor
//     const tutor = await User.create({
//       role: "tutor",
//       fname: "John",
//       lname: "Doe",
//       email: "tutor@ilstu.edu",
//       passwordHash: "hashedpassword123",
//       tutorCourses: [course179._id, course168._id],
//     });

//     const tutor2 = await User.create({
//       role: "tutor",
//       fname: "Jane",
//       lname: "Doe",
//       email: "tutor2@ilstu.edu",
//       passwordHash: "hashedpassword123",
//       tutorCourses: [course179._id, course168._id],
//     });

//     // create a test student
//     const student = await User.create({
//       role: "student",
//       fname: "Jane",
//       lname: "Doe",
//       email: "student@ilstu.edu",
//       passwordHash: "hashedpassword123",
//     });

//     // create a test tutor shift
//     const shift = await TutorShift.create({
//       tutorId: tutor2._id,
//       assignedByAdminId: admin._id,
//       shiftDate: new Date(Date.UTC(2026, 2, 11)), // months are indexed, new Date('2026-03-10')
//       startTime: "10:00",
//       endTime: "11:00",
//       isBooked: false,
//     });

//     // create another test tutor shift
//     const shift2 = await TutorShift.create({
//       tutorId: tutor._id,
//       assignedByAdminId: admin._id,
//       shiftDate: new Date(Date.UTC(2026, 2, 12)), // new Date('2026-03-12')
//       startTime: "15:00",
//       endTime: "16:00",
//       isBooked: true,
//     });

//     const shift3 = await TutorShift.create({
//       tutorId: tutor._id,
//       assignedByAdminId: admin._id,
//       shiftDate: new Date(Date.UTC(2026, 2, 11)), // new Date('2026-03-11')
//       startTime: "12:00",
//       endTime: "13:00",
//       isBooked: true,
//     });

//     const appointment = await Appointment.create({
//       studentId: student._id,
//       tutorShiftId: shift2._id,
//       course: "IT179",
//       appointmentDate: shift2.shiftDate,
//       startTime: shift2.startTime,
//       endTime: shift2.endTime,
//       appointmentStatus: "scheduled",
//       attendance: { attendanceStatus: "pending" },
//     });

//     const appointment2 = await Appointment.create({
//       studentId: student._id,
//       tutorShiftId: shift3._id,
//       course: "IT168",
//       appointmentDate: shift3.shiftDate,
//       startTime: shift3.startTime,
//       endTime: shift3.endTime,
//       appointmentStatus: "scheduled",
//       attendance: { attendanceStatus: "pending" },
//     });

//     const appointment3 = await Appointment.create({
//       studentId: student._id,
//       tutorShiftId: shift._id,
//       course: "IT179",
//       appointmentDate: shift.shiftDate,
//       startTime: shift.startTime,
//       endTime: shift.endTime,
//       appointmentStatus: "scheduled",
//       attendance: { attendanceStatus: "pending" },
//     });

//     // create a test session for student user
//     // req.session.user = {
//     //     _id: student._id,
//     //     role: student.role,
//     //     fname: student.fname,
//     //     lname: student.lname
//     // };
//     // req.session.user = {
//     //   _id: tutor._id,
//     //   role: tutor.role,
//     //   fname: tutor.fname,
//     //   lname: tutor.lname,
//     // };

//     req.session.save(() => {
//       res.send("Test data seeded successfully!");
//     });
//     // res.send('Test data seeded successfully!');
//   } catch (err) {
//     console.error(err);
//     res.send("Seeding failed: " + err.message);
//   }
// });


// TEMPORARY: seed baseline center hours
// Visit -> http://localhost:3000/seedCenter
// After first run → inserts 7 weekday records
// On later visits → should log "Center hours already exist", check terminal for "Center hours already exist" message!!
// I used mongosh to double-check, all weekdays correctly inserted from seedOpenCenter.js, terminal 
// showed "Center hours already exit" after visiting url 2+ times, used db.centeropens.countDocuments() = 7 
// app.get('/seedCenter', async (req, res) => {
//     try {
//         await seedOpenCenter();
//         res.send('Center hours seeded successfully!');
//     } catch (err) {
//         console.error(err);
//         res.send('Seeding failed: ' + err.message);
//     }
// });