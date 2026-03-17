const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

async function sendEmail({ to, cc, subject, html }) {
  await transporter.sendMail({
    from: `"IT Learning Center" <${process.env.GMAIL_EMAIL}>`,
    to,
    cc,
    subject,
    html
  });
  console.log(`Email sent to ${to} with subject "${subject}"`);
}
// ,
//   tls: {
//     rejectUnauthorized: false // needs to be changed later, but allows self-signed certs for development/testing
//   }

module.exports = { sendEmail };