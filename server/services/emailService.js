const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

async function sendEmail({ to, subject, html }) {
  await transporter.sendMail({
    from: `"IT Learning Center" <${process.env.GMAIL_EMAIL}>`,
    to,
    subject,
    html
  });
}

module.exports = { sendEmail };