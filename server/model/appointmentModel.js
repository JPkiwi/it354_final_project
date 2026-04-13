// record for a booked appointment. Contains student attendance information the tutor can update
const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
    {
        attendanceStatus: {type: String, enum: ["pending", "attended", "noShow"], default: "pending"},
        actualStart: {type: String}, // not initially required so tutor can add later and not need it to book appointment
        actualEnd: {type: String} // not initially required so tutor can add later and not need it to book appointment
    }, 
    { _id: false }
);

const appointmentSchema = new mongoose.Schema(
    {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        tutorShiftId: { type: mongoose.Schema.Types.ObjectId, ref: "TutorShift", required: true },
        course: { type: String, required: true },
        appointmentDate: { type: Date, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        appointmentStatus: { type: String, enum: ["scheduled", "completed", "cancelled"], default: "scheduled" },
        tutorComments: { type: String },
        attendance: attendanceSchema,
        calendarEventId: { type: String, default: null}
    },
    { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
