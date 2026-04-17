const mongoose = require("mongoose");

const centerExceptionSchema = new mongoose.Schema(
  {
    createdByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    exceptionDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    reason: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CenterException", centerExceptionSchema);