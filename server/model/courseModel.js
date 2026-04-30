// model for courses that tutors can select when creating a shift and students can select when booking an appointment
const mongoose = require("mongoose");
const courseSchema = new mongoose.Schema(
    {
        courseName: { type: String, default: "IT179" }
    }
);

module.exports = mongoose.model("Course", courseSchema);