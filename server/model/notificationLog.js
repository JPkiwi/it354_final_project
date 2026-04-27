const mongoose = require("mongoose");
const notificationLogSchema = new mongoose.Schema(
    {
        // changed from "timestamp" to "actionTime" for better readability
        actionTime: { type: Date, default: Date.now },
        appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
        recipientUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
        appointmentDate: { type: Date, required: true },
        notificationType: { type: String, enum: ["ADMIN_CANCEL_APPT", "STUDENT_CANCEL_APPT", "STUDENT_BOOK_APPT", "SEND_EMAIL_FAILED", "ACCT_DEACTIVATION"], required: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("NotificationLog", notificationLogSchema);