const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
    {
        role: { type: String, enum: ["admin", "tutor", "student"], default: "student" },
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true },
        passwordHash: { type: String, required: true, minlength: 6 },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);