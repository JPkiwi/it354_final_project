const mongoose = require("mongoose");
const notificationLogSchema = new mongoose.Schema(
    {
        // changed from "timestamp" to "actionTime" for better readability
        actionTime: { type: Date, default: Date.now },
        appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
        recipientUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
        appointmentDate: { type: Date, required: true },
        notificationType: { type: String, enum: ["ADMIN_CANCEL_APPT", "STUDENT_CANCEL_APPT", "STUDENT_BOOK_APPT", "SEND_EMAIL_FAILED"], required: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("NotificationLog", notificationLogSchema);