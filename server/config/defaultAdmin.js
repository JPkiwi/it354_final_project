const User = require("../model/userModel");

// for hashing passwords
const bcrypt = require("bcrypt");

// adds default admin account to MongoDB if it doesn't exist
exports.createAdminAccount = async () => {
  let adminAccount = await User.findOne({
    role: "admin",
    fname: "Admin",
    lname: "Control",
    email: process.env.GMAIL_EMAIL,
  });

  if (!adminAccount) {
    const hashedPassword = await bcrypt.hash(
      process.env.EMAIL_ADMIN_PASSWORD,
      10,
    );
    adminAccount = await User.create({
      role: "admin",
      fname: "Admin",
      lname: "Control",
      email: process.env.GMAIL_EMAIL,
      passwordHash: hashedPassword,
    });
  }
}
