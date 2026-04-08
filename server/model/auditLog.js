const mongoose = require("mongoose");
// audit logging not just for appointments --> need to log cancelled appointments, status updates, changed hours, etc
const auditLogSchema = new mongoose.Schema(
    {
        timestamp: { type: Date, default: Date.now },
        actionUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        actionType: { type: String, enum: ["APPOINTMENT_CREATED", "APPOINTMENT_CANCELLED", "APPOINTMENT_COMPLETED",
            "TUTOR_ADDED", "TUTOR_STATUS_CHANGED", "TUTOR_SHIFTS_ASSIGNED", "TUTOR_SHIFTS_REMOVED", 
            "STUDENT_ADDED", "STUDENT_STATUS_CHANGED", "CENTER_HOURS_CHANGED"
        ], required: true },
        targetUserId: {type: mongoose.Schema.Types.ObjectId, ref: "User", default: null},
        appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: null },
        details: { type: String }
    }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);