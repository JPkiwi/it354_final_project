const mongoose = require("mongoose");


const centerOpenScheduleSchema = new mongoose.Schema({
    // storing weekday name, “unique” for 7 total documents, no duplicates of baseline
    weekday: {type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], 
    required: true, unique: true},

    isClosed: {type: Boolean, default: false},

    // the openTime is required only IF center is not closed 
// ex: if isClosed === true for Saturday, then !this.isClosed = false, so openTime is not required
// SAME LOGIC for close time
// Default set times are 11am-6pm, but admin can change the hours
    openTime: {type: String, required: function () {return !this.isClosed;}, default: "11:00"},
    closeTime: {type: String, required: function () {return !this.isClosed;}, default: "18:00"},
},

{timestamps: true}
)

module.exports = mongoose.model("CenterOpen", centerOpenScheduleSchema);