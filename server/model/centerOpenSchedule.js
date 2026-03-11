const mongoose = require("mongoose");


const centerOpenScheduleSchema = new mongoose.Schema({
    // storing weekday name, “unique” for 7 total documents, no duplicates of baseline
    weekday: {type: String, enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], 
    required: true, unique: true},

    isClosed: {type: Boolean, default: false},

    // the openTime is required only IF center is not closed 
// ex: if isClosed === true for Saturday, then !this.isClosed = false, so openTime is not required
// SAME LOGIC for close time
    openTime: {type: String,required: function () {return !this.isClosed;}},
    closeTime: {type: String,required: function () {return !this.isClosed;}},
},

{timestamps: true}
)

module.exports = mongoose.model("CenterOpen", centerOpenScheduleSchema);