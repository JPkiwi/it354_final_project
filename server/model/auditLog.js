const mongoose = require("mongoose");
const auditLogSchema = new mongoose.Schema(
    {
        timestamp: { type: Date, default: Date.now },
        actionUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        actionType: { type: String, enum: ["APPOINTMENT_CREATED", "APPOINTMENT_CANCELLED", "APPOINTMENT_COMPLETED"], required: true },
        appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
        details: { type: String }
    }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);