const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
    {
        role: { type: String, enum: ["admin", "tutor", "student"], default: "student" },
        fname: { type: String, required: true, trim: true },
        lname: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true },
        passwordHash: { type: String, required: true, minlength: 6 },
        isActive: { type: Boolean, default: true },
        googleTokens: { type: Object, default: null},
        // only for tutors, references courses they can tutor
        tutorCourses: {
            type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
            validate: {
                validator: function (course) {
                    if (this.role === "tutor") {
                        return course && course.length > 0;
                    }
                    // if not a tutor, then course array should be empty or not given
                    return !course || course.length === 0;
                },
                message: "A tutor must be able to tutor at least one course."

            }
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);