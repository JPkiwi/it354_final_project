const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_ADMIN,
    pass: process.env.GMAIL_APP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function sendEmail({ to, cc, subject, html }) {
  await transporter.sendMail({
    from: `"IT Learning Center" <${process.env.GMAIL_ADMIN}>`,
    to,
    cc,
    subject,
    html
  });
}

module.exports = { sendEmail };