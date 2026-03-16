const bcrypt = require("bcrypt");
const User = require("../model/userModel");

//only needed if testing student email confirmation for booked appointments, otherwise can be left out
async function seedStudent() {
  try {
    const studentHash = await bcrypt.hash('hashPass1234', 10);
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

  } catch (err) {
    console.error("Error seeding tutor shifts and student:", err.message);
  }
}

module.exports = seedTutorShiftsAndStudent;