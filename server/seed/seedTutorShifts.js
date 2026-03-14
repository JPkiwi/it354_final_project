const bcrypt = require("bcrypt");
const TutorShift = require("../model/tutorShiftModel");
const User = require("../model/userModel");


async function seedTutorShiftsAndStudent() {
  try {
    const studentHash = await bcrypt.hash('hashPass1234', 10);
    // First, create the student
    const existingStudent = await User.findOne({ email: "allesle@ilstu.edu" });
    if (!existingStudent) {
      const student = await User.create({
        role: "student",
        fname: "Allesle",
        lname: "Student",
        email: "allesle@ilstu.edu",
        passwordHash: studentHash, 
      });
      console.log("Student created:", student.email);
    } else {
      console.log("Student already exists:", existingStudent.email);
    }

    // // Assume admin and tutors exist from previous seeding
    // const admin = await User.findOne({ role: "admin" });
    // const tutor1 = await User.findOne({ email: "john.smith@gmail.com" });
    // const tutor2 = await User.findOne({ email: "sarah.johnson@gmail.com" });

    // if (!admin || !tutor1 || !tutor2) {
    //   console.log("Admin or tutors not found. Please run the main seed first.");
    //   return;
    // }

    // // Create 8 shifts spanning 4 days, each 1 hour
    // const shifts = [
    //   // Day 1: 2026-04-14
    //   { tutorId: tutor1._id, shiftDate: new Date("2026-04-14"), startTime: "10:00", endTime: "11:00" },
    //   { tutorId: tutor2._id, shiftDate: new Date("2026-04-14"), startTime: "14:00", endTime: "15:00" },
    //   // Day 2: 2026-04-15
    //   { tutorId: tutor1._id, shiftDate: new Date("2026-04-15"), startTime: "11:00", endTime: "12:00" },
    //   { tutorId: tutor2._id, shiftDate: new Date("2026-04-15"), startTime: "15:00", endTime: "16:00" },
    //   // Day 3: 2026-04-16
    //   { tutorId: tutor1._id, shiftDate: new Date("2026-04-16"), startTime: "12:00", endTime: "13:00" },
    //   { tutorId: tutor2._id, shiftDate: new Date("2026-04-16"), startTime: "16:00", endTime: "17:00" },
    //   // Day 4: 2026-04-17
    //   { tutorId: tutor1._id, shiftDate: new Date("2026-04-17"), startTime: "13:00", endTime: "14:00" },
    //   { tutorId: tutor2._id, shiftDate: new Date("2026-04-17"), startTime: "17:00", endTime: "18:00" },
    // ];

    // for (const shiftData of shifts) {
    //   const existingShift = await TutorShift.findOne({
    //     tutorId: shiftData.tutorId,
    //     shiftDate: shiftData.shiftDate,
    //     startTime: shiftData.startTime,
    //   });
    //   if (!existingShift) {
    //     await TutorShift.create({
    //       ...shiftData,
    //       assignedByAdminId: admin._id,
    //     });
    //     console.log(`Shift created for ${shiftData.shiftDate.toISOString().split('T')[0]} ${shiftData.startTime}-${shiftData.endTime}`);
    //   } else {
    //     console.log(`Shift already exists for ${shiftData.shiftDate.toISOString().split('T')[0]} ${shiftData.startTime}-${shiftData.endTime}`);
    //   }
    // }

    // console.log("Tutor shifts and student seeding completed.");
  } catch (err) {
    console.error("Error seeding tutor shifts and student:", err.message);
  }
}

module.exports = seedTutorShiftsAndStudent;