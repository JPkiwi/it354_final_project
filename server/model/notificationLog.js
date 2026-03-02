const mongoose = require("mongoose");
const notificationLogSchema = new mongoose.Schema(
    {
        timestamp: { type: Date, default: Date.now },
        date: { type: Date, required: true },
        appointmentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true }],
        notificationType: { type: String, enum: ["ADMIN_REMINDER", "DAILY_SUMMARY"], required: true }
    }
);

module.exports = mongoose.model("NotificationLog", notificationLogSchema);