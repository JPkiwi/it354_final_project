// this schema represents the blocks of time the center will be closed, such as holidays 
// (USED FOR BLACKOUT DATE FUNCTIONALITY)
const mongoose = require("mongoose");
// add data validation to make sure an admin user is creating a record 
const centerClosedScheduleSchema = new mongoose.Schema(
    {
        createdByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        reason: { type: String, required: true, trim: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("CenterClosedSchedule", centerClosedScheduleSchema);