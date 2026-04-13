const mongoose = require("mongoose");
const notificationLogSchema = new mongoose.Schema(
    {
        timestamp: { type: Date, default: Date.now },
        appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
        recipientUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
        appointmentDate: { type: Date, required: true },
        isRead: { type: Boolean, default: false },
        readAt: { type: Date, default: null },
        notificationType: { type: String, enum: ["ADMIN_NOTIF", "DAILY_SUMMARY"], required: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("NotificationLog", notificationLogSchema);