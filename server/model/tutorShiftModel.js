// tutor shifts are broken up by hour so appointments can be booked per hour a tutor is scheduled to work
const mongoose = require("mongoose");
const tutorShiftSchema = new mongoose.Schema(
    {
        tutorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        assignedByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        shiftDate: { type: Date, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        isBooked: { type: Boolean, default: false }
        // add link to individual tutor google calender??
    },
    { timestamps: true }
);

module.exports = mongoose.model("TutorShift", tutorShiftSchema);